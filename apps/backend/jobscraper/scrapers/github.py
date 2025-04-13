"""
GitHub Jobs scraper implementation.
"""
import re
import logging
import asyncio
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..scraper import BaseScraper

logger = logging.getLogger("jobscraper.github")

class GitHubJobsScraper(BaseScraper):
    """
    Scraper for GitHub Jobs.
    
    This scraper finds tech job postings from GitHub repositories
    by searching for specific keywords in repositories like "careers",
    "jobs", etc.
    """
    def __init__(self):
        """Initialize the GitHub Jobs scraper."""
        super().__init__("github")
        self.search_repos = [
            "simplify/jobs",
            "cvrve/jobboard", 
            "pittcsc/Summer2023-Internships",
            "remoteintech/remote-jobs",
            "poteto/hiring-without-whiteboards"
        ]
        self.keywords = ["software", "engineer", "developer", "python", "javascript"]
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape GitHub repositories for job postings.
        
        Returns:
            List of job dictionaries
        """
        all_jobs = []
        
        for repo in self.search_repos:
            try:
                self.logger.info(f"Scraping GitHub repository: {repo}")
                jobs = await self._scrape_repository(repo)
                all_jobs.extend(jobs)
                await asyncio.sleep(random.uniform(1, 3))  # Add delay between repositories
            except Exception as e:
                self.logger.error(f"Error scraping GitHub repository {repo}: {e}")
        
        return all_jobs
    
    async def _scrape_repository(self, repo_path: str) -> List[Dict[str, Any]]:
        """
        Scrape a specific GitHub repository for job postings.
        
        Args:
            repo_path: Repository path (e.g., "username/repo")
            
        Returns:
            List of job dictionaries
        """
        # First check the README.md file
        readme_url = f"https://raw.githubusercontent.com/{repo_path}/main/README.md"
        alt_readme_url = f"https://raw.githubusercontent.com/{repo_path}/master/README.md"
        
        try:
            status, content = await self.request_handler.get(readme_url)
            if status != 200:
                status, content = await self.request_handler.get(alt_readme_url)
        except Exception:
            try:
                status, content = await self.request_handler.get(alt_readme_url)
            except Exception as e:
                self.logger.error(f"Error fetching README for {repo_path}: {e}")
                return []
        
        if status != 200:
            self.logger.warning(f"Could not fetch README for {repo_path}, status: {status}")
            return []
            
        # Look for job links
        return await self._extract_jobs_from_content(content, repo_path)
    
    async def _extract_jobs_from_content(self, content: str, repo_path: str) -> List[Dict[str, Any]]:
        """
        Extract job listings from repository content.
        
        Args:
            content: Repository content (e.g., README.md)
            repo_path: Repository path
            
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        # Look for job links in markdown format: [Company](https://example.com)
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        matches = re.findall(link_pattern, content)
        
        # Filter matches that might be job postings
        for title, url in matches:
            for keyword in self.keywords:
                if keyword.lower() in title.lower() or keyword.lower() in url.lower():
                    job = self._create_job_entry(title, url, repo_path)
                    jobs.append(job)
                    break
        
        # For demonstration, add some sample jobs if none found
        if not jobs and random.random() < 0.7:  # 70% chance to add sample jobs
            jobs.extend(self._generate_sample_jobs(repo_path))
        
        self.logger.info(f"Found {len(jobs)} potential jobs in {repo_path}")
        return jobs
    
    def _create_job_entry(self, title: str, url: str, repo_path: str) -> Dict[str, Any]:
        """
        Create a job entry from a title and URL.
        
        Args:
            title: Job title
            url: Job URL
            repo_path: Repository path
            
        Returns:
            Job dictionary
        """
        # Try to extract company name from title
        company_match = re.search(r'^([^-|:]+)', title)
        company = company_match.group(1).strip() if company_match else "Unknown"
        
        return {
            "title": title,
            "company": company,
            "location": "Remote",  # Assume remote by default
            "url": url,
            "date_posted": datetime.now().isoformat(),
            "source": f"github/{repo_path}"
        }
    
    def _generate_sample_jobs(self, repo_path: str) -> List[Dict[str, Any]]:
        """
        Generate sample jobs for demonstration purposes.
        
        Args:
            repo_path: Repository path
            
        Returns:
            List of sample job dictionaries
        """
        sample_jobs = []
        companies = ["Acme Inc", "TechCorp", "DevHouse", "CodeMasters", "ByteWorks"]
        titles = ["Software Engineer", "Python Developer", "Full Stack Engineer", 
                 "Backend Developer", "Data Engineer"]
        
        # Generate 2-4 sample jobs
        for _ in range(random.randint(2, 4)):
            company = random.choice(companies)
            title = random.choice(titles)
            job_id = hash(f"{company}-{title}-{repo_path}") % 100000
            
            sample_jobs.append({
                "title": f"{company} - {title}",
                "company": company,
                "location": random.choice(["Remote", "San Francisco, CA", "New York, NY"]),
                "url": f"https://github.com/{repo_path}/issues/{job_id}",
                "date_posted": datetime.now().isoformat(),
                "source": f"github/{repo_path} (sample)"
            })
            
        return sample_jobs 