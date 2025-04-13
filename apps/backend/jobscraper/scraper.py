"""
Job scraper module for scraping jobs from various sources.
This module orchestrates multiple scrapers and handles the process of fetching
and storing job listings with rate limiting and error handling.
"""
import logging
import time
import asyncio
import random
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Any, Optional, Set, Callable, Tuple
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("jobscraper")

# Global variables to track scraping state
is_scraping = False
scrape_progress = 0
scrape_start_time = None
active_scrapers = {}

class RateLimiter:
    """
    Rate limiter to control the frequency of requests to a service.
    Implements token bucket algorithm for rate limiting.
    """
    def __init__(self, rate: float, per: float, burst: int = 1):
        """
        Initialize rate limiter.
        
        Args:
            rate: Number of requests allowed in time period
            per: Time period in seconds
            burst: Maximum bucket size (max consecutive requests allowed)
        """
        self.rate = rate  # requests per second
        self.per = per  # seconds
        self.burst = burst
        self.tokens = burst
        self.updated_at = time.monotonic()
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        """
        Acquire a token to make a request.
        Blocks until a token is available.
        """
        async with self.lock:
            while True:
                self._add_new_tokens()
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                # Wait until our next token would be added
                wait_time = (1.0 / self.rate) - (time.monotonic() - self.updated_at)
                if wait_time <= 0:
                    continue
                await asyncio.sleep(wait_time)
    
    def _add_new_tokens(self):
        """Add new tokens based on elapsed time."""
        now = time.monotonic()
        time_since_update = now - self.updated_at
        new_tokens = time_since_update * self.rate
        if new_tokens > 0:
            self.tokens = min(self.tokens + new_tokens, self.burst)
            self.updated_at = now


class RetryWithBackoff:
    """
    Implements exponential backoff retries for failed requests.
    """
    def __init__(
        self, 
        max_retries: int = 5, 
        base_delay: float = 1.0, 
        max_delay: float = 60.0,
        jitter: bool = True
    ):
        """
        Initialize the retry handler.
        
        Args:
            max_retries: Maximum number of retries
            base_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            jitter: Whether to add random jitter to delay
        """
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.jitter = jitter
    
    async def execute(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function with retry logic.
        
        Args:
            func: Function to execute
            *args: Arguments to pass to function
            **kwargs: Keyword arguments to pass to function
            
        Returns:
            The result of the function
            
        Raises:
            Exception: If all retries fail
        """
        retry_count = 0
        last_exception = None
        
        while retry_count <= self.max_retries:
            try:
                result = await func(*args, **kwargs)
                if retry_count > 0:
                    logger.info(f"Successfully recovered after {retry_count} retries")
                return result
            except Exception as e:
                last_exception = e
                retry_count += 1
                
                if retry_count > self.max_retries:
                    logger.error(f"Maximum retries ({self.max_retries}) exceeded")
                    break
                
                # Calculate backoff delay
                delay = min(self.max_delay, self.base_delay * (2 ** (retry_count - 1)))
                
                # Add jitter if enabled (helps avoid thundering herd problem)
                if self.jitter:
                    delay = delay * (0.5 + random.random())
                
                logger.warning(
                    f"Request failed with {str(e)}, retrying in {delay:.2f}s "
                    f"(retry {retry_count}/{self.max_retries})"
                )
                await asyncio.sleep(delay)
        
        raise last_exception


class RequestHandler:
    """
    Handles HTTP requests with rate limiting and backoff.
    """
    def __init__(self, 
                service_name: str,
                rate: float = 1.0, 
                per: float = 1.0,
                max_retries: int = 3):
        """
        Initialize request handler.
        
        Args:
            service_name: Name of the service being accessed
            rate: Number of requests allowed in time period
            per: Time period in seconds
            max_retries: Maximum number of retries
        """
        self.service_name = service_name
        self.rate_limiter = RateLimiter(rate=rate, per=per, burst=1)
        self.retry_handler = RetryWithBackoff(max_retries=max_retries)
        self.session = None
    
    async def get_session(self):
        """Lazily initialize session."""
        if self.session is None:
            import aiohttp
            self.session = aiohttp.ClientSession(
                headers={"User-Agent": self._random_user_agent()}
            )
        return self.session
    
    def _random_user_agent(self) -> str:
        """Generate a random user agent."""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
        ]
        return random.choice(user_agents)
    
    async def get(self, url: str, **kwargs) -> Tuple[int, str]:
        """
        Make a GET request with rate limiting and retry logic.
        
        Args:
            url: URL to request
            **kwargs: Additional arguments to pass to aiohttp.ClientSession.get
            
        Returns:
            Tuple of (status_code, response_text)
        """
        await self.rate_limiter.acquire()
        
        async def _do_request():
            session = await self.get_session()
            async with session.get(url, **kwargs) as response:
                text = await response.text()
                if response.status >= 400:
                    raise Exception(f"HTTP error {response.status}: {text[:100]}...")
                return response.status, text
        
        return await self.retry_handler.execute(_do_request)
    
    async def close(self):
        """Close the session."""
        if self.session:
            await self.session.close()
            self.session = None


class BaseScraper:
    """
    Base class for all scrapers. 
    Provides common functionality and interface.
    """
    def __init__(self, name: str):
        """
        Initialize scraper.
        
        Args:
            name: Name of the scraper
        """
        self.name = name
        self.logger = logging.getLogger(f"jobscraper.{name}")
        self.request_handler = RequestHandler(
            service_name=name,
            rate=0.5,  # 1 request every 2 seconds
            per=1.0,
            max_retries=3
        )
        self._status = "idle"
        self._last_run = None
    
    @property
    def status(self) -> Dict[str, Any]:
        """Get current status of the scraper."""
        return {
            "status": self._status,
            "last_run": self._last_run.isoformat() if self._last_run else None
        }
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Execute the scraping process.
        
        Returns:
            List of job dictionaries
        
        Raises:
            NotImplementedError: Must be implemented by subclasses
        """
        raise NotImplementedError("Subclasses must implement scrape method")
    
    async def run(self) -> List[Dict[str, Any]]:
        """
        Run the scraper and update status.
        
        Returns:
            List of job dictionaries
        """
        try:
            self._status = "running"
            start_time = time.time()
            self.logger.info(f"Starting {self.name} scraper")
            
            jobs = await self.scrape()
            
            elapsed = time.time() - start_time
            self.logger.info(f"Finished {self.name} scraper in {elapsed:.2f}s, found {len(jobs)} jobs")
            self._status = "success"
            self._last_run = datetime.now()
            return jobs
        except Exception as e:
            self.logger.error(f"Error in {self.name} scraper: {str(e)}", exc_info=True)
            self._status = "error"
            return []
        finally:
            await self.request_handler.close()


class LinkedInScraper(BaseScraper):
    """
    Scraper for LinkedIn jobs.
    """
    def __init__(self):
        super().__init__("linkedin")
        self.keywords = ["software engineer", "python developer", "data scientist"]
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape jobs from LinkedIn.
        
        Returns:
            List of job dictionaries
        """
        all_jobs = []
        
        for keyword in self.keywords:
            self.logger.info(f"Scraping LinkedIn jobs for keyword: {keyword}")
            try:
                jobs = await self._scrape_for_keyword(keyword)
                all_jobs.extend(jobs)
                # Add a delay between keywords
                await asyncio.sleep(random.uniform(2, 5))
            except Exception as e:
                self.logger.error(f"Error scraping LinkedIn for {keyword}: {str(e)}")
        
        return all_jobs
    
    async def _scrape_for_keyword(self, keyword: str, start: int = 0) -> List[Dict[str, Any]]:
        """
        Scrape LinkedIn jobs for a specific keyword.
        
        Args:
            keyword: Search keyword
            start: Starting position for pagination
            
        Returns:
            List of job dictionaries
        """
        url = f"https://www.linkedin.com/jobs/search/?keywords={keyword.replace(' ', '%20')}&start={start}"
        self.logger.info(f"Fetching {url}")
        
        status, html = await self.request_handler.get(url)
        
        # Simple parsing for demonstration purposes
        # In a real implementation, you would use BeautifulSoup or similar
        jobs = []
        
        # Simulate finding job links (in real implementation would parse HTML)
        import re
        job_links = re.findall(r'href="(https://www.linkedin.com/jobs/view/[^"]+)"', html)
        
        for link in job_links[:5]:  # Limit to 5 jobs per keyword for demonstration
            job_details = await self._get_job_details(link)
            if job_details:
                jobs.append(job_details)
        
        return jobs
    
    async def _get_job_details(self, job_url: str) -> Optional[Dict[str, Any]]:
        """
        Get details for a specific job.
        
        Args:
            job_url: URL of the job listing
            
        Returns:
            Job details dictionary or None if failed
        """
        try:
            status, html = await self.request_handler.get(job_url)
            
            # Simulate extracting job details (would use proper HTML parsing)
            import re
            title_match = re.search(r'<title>([^<]+)</title>', html)
            title = title_match.group(1) if title_match else "Unknown Title"
            
            company_match = re.search(r'hiring">([^<]+)</a>', html)
            company = company_match.group(1) if company_match else "Unknown Company"
            
            # Create job object
            return {
                "title": title.replace(" | LinkedIn", ""),
                "company": company.strip(),
                "location": "Remote",  # Simplified for demo
                "url": job_url,
                "date_posted": datetime.now().isoformat(),
                "source": "linkedin"
            }
        except Exception as e:
            self.logger.error(f"Error getting job details for {job_url}: {str(e)}")
            return None


class GoogleJobsScraper(BaseScraper):
    """
    Scraper for Google jobs.
    """
    def __init__(self):
        super().__init__("google")
        self.keywords = ["python engineer", "software developer"]
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape jobs from Google.
        
        Returns:
            List of job dictionaries
        """
        # Simplified implementation for demonstration
        jobs = []
        
        for keyword in self.keywords:
            for i in range(1, 3):  # Simulate pages
                await asyncio.sleep(random.uniform(1, 3))  # Simulate delay
                
                # Simulate finding 2-3 jobs per page
                for j in range(random.randint(2, 3)):
                    job_id = f"g-{hash(f'{keyword}-{i}-{j}') % 1000000}"
                    jobs.append({
                        "title": f"{keyword.title()} - Level {i}",
                        "company": "Google",
                        "location": random.choice(["Mountain View, CA", "Remote", "New York, NY"]),
                        "url": f"https://careers.google.com/jobs/{job_id}/",
                        "date_posted": datetime.now().isoformat(),
                        "source": "google"
                    })
        
        return jobs


class ScraperManager:
    """
    Manages multiple scrapers and coordinates their execution.
    """
    def __init__(self):
        """Initialize the scraper manager."""
        self.scrapers = {}
        self.register_scrapers()
        self.running = False
        self.progress = 0
        self.start_time = None
    
    def register_scrapers(self):
        """Register all available scrapers."""
        # Remove the default LinkedIn scraper
        # self.scrapers["linkedin"] = LinkedInScraper()
        self.scrapers["google"] = GoogleJobsScraper()
        
        # Import and register the GitHub scraper
        try:
            # Use a relative import from within the package
            from .scrapers.github import GitHubJobsScraper
            self.scrapers["github"] = GitHubJobsScraper()
            logger.info("Successfully registered GitHub scraper")
        except ImportError as e:
            logger.warning(f"Could not register GitHub scraper: {e}")
            
        # Import and register our custom LinkedIn scraper
        try:
            # Use a relative import from within the package
            from .scrapers.linkedin import LinkedInScraper as CustomLinkedInScraper
            self.scrapers["linkedin"] = CustomLinkedInScraper()
            logger.info("Successfully registered LinkedIn scraper")
        except ImportError as e:
            logger.warning(f"Could not register LinkedIn scraper: {e}")
            # Fall back to the built-in LinkedIn scraper
            self.scrapers["linkedin"] = LinkedInScraper()
            logger.info("Using built-in LinkedIn scraper as fallback")
        
        # Add more scrapers here
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get status of all scrapers.
        
        Returns:
            Dictionary of scraper statuses
        """
        status = {
            "running": self.running,
            "progress": self.progress,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "scrapers": {}
        }
        
        for name, scraper in self.scrapers.items():
            status["scrapers"][name] = scraper.status
        
        return status
    
    async def run_scraper(self, name: str) -> List[Dict[str, Any]]:
        """
        Run a specific scraper.
        
        Args:
            name: Name of the scraper to run
            
        Returns:
            List of jobs scraped
            
        Raises:
            ValueError: If scraper does not exist
        """
        if name not in self.scrapers:
            raise ValueError(f"Scraper {name} does not exist")
        
        return await self.scrapers[name].run()
    
    async def run_all(self) -> List[Dict[str, Any]]:
        """
        Run all scrapers in parallel.
        
        Returns:
            List of all jobs scraped
        """
        if self.running:
            raise RuntimeError("Scrapers are already running")
        
        self.running = True
        self.progress = 0
        self.start_time = datetime.now()
        all_jobs = []
        
        try:
            total_scrapers = len(self.scrapers)
            completed_scrapers = 0
            
            # Run scrapers in parallel
            tasks = []
            for name, scraper in self.scrapers.items():
                tasks.append(self.run_scraper(name))
            
            # Wait for all scrapers to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Scraper failed: {str(result)}")
                else:
                    all_jobs.extend(result)
                
                completed_scrapers += 1
                self.progress = (completed_scrapers / total_scrapers) * 100
            
            return all_jobs
        finally:
            self.running = False
            self.progress = 100
    
    def cancel(self):
        """Cancel any running scraper jobs."""
        self.running = False


# Global instance
scraper_manager = ScraperManager()


async def start_scrape_job() -> List[Dict[str, Any]]:
    """
    Start a scraping job.
    
    Returns:
        List of jobs scraped
    """
    global is_scraping, scrape_progress, scrape_start_time

    if is_scraping:
        logger.warning("Scraping already in progress")
        return []

    is_scraping = True
    scrape_progress = 0
    scrape_start_time = datetime.now()

    try:
        jobs = await scraper_manager.run_all()
        return jobs
    finally:
        is_scraping = False
        scrape_progress = 100


def cancel_scrape_job() -> bool:
    """
    Cancel a scraping job.
    
    Returns:
        True if job was canceled, False otherwise
    """
    global is_scraping

    if not is_scraping:
        return False

    scraper_manager.cancel()
    is_scraping = False
    return True


def get_scrape_status() -> Dict[str, Any]:
    """
    Get status of current scraping job.
    
    Returns:
        Dictionary of scraping status
    """
    return {
        "scraping": is_scraping,
        "scrapeProgress": scrape_progress,
        "startTime": scrape_start_time.isoformat() if scrape_start_time else None,
        "scrapers": scraper_manager.get_status()
    }


async def main():
    """Run the scraper directly for testing."""
    logging.basicConfig(level=logging.INFO)
    print("Starting job scraper...")
    
    try:
        jobs = await start_scrape_job()
        print(f"Scraped {len(jobs)} jobs")
        
        # Print the jobs
        for job in jobs:
            print(f"{job['title']} at {job['company']} - {job['location']}")
            print(f"URL: {job['url']}")
            print("-" * 50)
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
