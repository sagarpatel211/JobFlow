"""
LinkedIn Jobs scraper implementation.
"""
import re
import os
import logging
import asyncio
import random
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
import json
from urllib.parse import urlparse
from pathlib import Path

from bs4 import BeautifulSoup
from ..scraper import BaseScraper

logger = logging.getLogger("jobscraper.linkedin")

class LinkedInScraper(BaseScraper):
    """
    Scraper for LinkedIn jobs.
    
    This scraper implements functionality to search for jobs on LinkedIn
    and filter them based on company follower counts and location.
    """
    def __init__(self):
        """Initialize LinkedIn scraper with configuration."""
        super().__init__("linkedin")
        
        # Configure data files for follower counts and filtering
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)
        
        self.followers_file = data_dir / "followers.txt"
        self.blacklist_file = data_dir / "blacklist.txt"
        self.whitelist_file = data_dir / "whitelist.txt"
        self.templist_file = data_dir / "templist.txt"
        
        # Ensure files exist
        for file_path in [self.followers_file, self.blacklist_file, self.whitelist_file, self.templist_file]:
            if not file_path.exists():
                file_path.touch()
        
        # Configure job search parameters
        self.job_roles = [
            'software intern',
            'software engineer intern',
            'software developer intern',
            'backend intern',
            'full stack intern',
            'computer science intern',
        ]
        
        # Configure request settings - more conservative rate limits
        self.request_handler.rate_limiter.rate = 0.1  # 1 request per 10 seconds
        self.request_handler.retry_handler.max_retries = 5
        self.request_handler.retry_handler.base_delay = 5.0
        self.request_handler.retry_handler.max_delay = 300.0
        
        # US states data for location filtering
        self.us_states = [
            "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
            "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
            "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
            "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
            "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
            "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
            "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
            "Wisconsin", "Wyoming", "District of Columbia", "D.C.", "DC"
        ]
        
        self.us_state_abbrs = [
            "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN",
            "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
            "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN",
            "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
        ]
    
    async def scrape(self) -> List[Dict[str, Any]]:
        """
        Scrape LinkedIn jobs for all configured job roles.
        
        Returns:
            List of job dictionaries
        """
        all_jobs = []
        
        for role in self.job_roles:
            self.logger.info(f"Scraping LinkedIn jobs for role: {role}")
            try:
                jobs = await self._scrape_jobs_for_keyword(role)
                all_jobs.extend(jobs)
                # Add delay between job roles
                await asyncio.sleep(random.uniform(5, 10))
            except Exception as e:
                self.logger.error(f"Error scraping LinkedIn for {role}: {str(e)}")
        
        self.logger.info(f"Found a total of {len(all_jobs)} jobs across all roles")
        return all_jobs
    
    async def _scrape_jobs_for_keyword(self, keyword: str, start: int = 0, attempt: int = 0) -> List[Dict[str, Any]]:
        """
        Scrape LinkedIn jobs for a specific keyword with pagination.
        
        Args:
            keyword: Job role to search for
            start: Starting position for pagination
            attempt: Current retry attempt number
            
        Returns:
            List of job dictionaries
        """
        jobs = []
        has_more_results = True
        
        while has_more_results:
            # Random delay between pages
            await asyncio.sleep(random.uniform(3, 7))
            
            self.logger.info(f"Scraping LinkedIn for {keyword} at position {start}")
            
            # Construct API URL with pagination
            api_url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={keyword.replace(' ', '%20')}&start={start}"
            
            try:
                # Make the request with custom headers
                headers = {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'pragma': 'no-cache',
                    'sec-ch-ua': '"Chromium";v="114", "Google Chrome";v="114", "Not=A?Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-user': '?1',
                    'Referer': 'https://www.linkedin.com/jobs/',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                }
                
                status, html = await self.request_handler.get(api_url, headers=headers)
                
                # Check for end of pagination
                if status == 400 or status == 404 or "No matching jobs found" in html:
                    self.logger.info(f"Reached end of results for {keyword}")
                    has_more_results = False
                    break
                
                # Extract jobs from HTML
                page_jobs = await self._extract_job_details(html)
                self.logger.info(f"Found {len(page_jobs)} jobs on this page")
                
                # Add valid jobs to results
                for job in page_jobs:
                    if job["title"] and job["company"] and job["url"]:
                        # Remove query parameters from URL
                        job["url"] = self._remove_query_params(job["url"])
                        jobs.append(job)
                
                # Move to next page
                start += 25
                
                # Stop if no jobs found on this page
                if len(page_jobs) == 0:
                    has_more_results = False
                
            except Exception as e:
                self.logger.error(f"Error scraping page: {str(e)}")
                if attempt >= 3:
                    self.logger.warning(f"Too many failed attempts for {keyword}, moving on")
                    has_more_results = False
                else:
                    delay = min(300, 30 * (2 ** attempt))
                    self.logger.info(f"Retrying after {delay} seconds (attempt {attempt+1}/3)")
                    await asyncio.sleep(delay)
                    return await self._scrape_jobs_for_keyword(keyword, start, attempt + 1)
        
        self.logger.info(f"Completed scraping for {keyword}, found {len(jobs)} jobs")
        return jobs
    
    async def _extract_job_details(self, html: str) -> List[Dict[str, Any]]:
        """
        Extract job details from LinkedIn jobs page HTML.
        
        Args:
            html: HTML content from LinkedIn jobs page
            
        Returns:
            List of job dictionaries
        """
        if not html:
            return []
        
        job_list = []
        soup = BeautifulSoup(html, 'lxml')
        job_elements = soup.select('li div.base-card--link.job-search-card')
        
        self.logger.info(f"Found {len(job_elements)} job elements in HTML")
        
        for element in job_elements:
            try:
                # Extract job link
                job_link_elem = element.select_one('.base-card__full-link')
                if not job_link_elem or not job_link_elem.get('href'):
                    continue
                
                job_link = job_link_elem.get('href', '')
                
                # Extract company info
                company_elem = element.select_one('.hidden-nested-link')
                if not company_elem:
                    continue
                    
                company_url = company_elem.get('href', '')
                company_name = company_elem.get_text().strip() or 'No Company'
                
                # Posted date
                date_elem = element.select_one('.job-search-card__listdate')
                posted_date = date_elem.get('datetime') if date_elem else datetime.now().isoformat()
                
                # Job title
                title_elem = element.select_one('.base-search-card__title')
                job_title = title_elem.get_text().strip() if title_elem else 'No Title'
                
                # Location
                location_elem = element.select_one('.job-search-card__location')
                location = location_elem.get_text().strip() if location_elem else 'No Location'
                
                # Actively hiring status
                benefits_text = element.select_one('.job-posting-benefits__text')
                actively_hiring = benefits_text and 'Actively Hiring' in benefits_text.get_text() if benefits_text else False
                
                # Check company followers count
                if company_url:
                    followers_count = await self._get_company_follower_count(company_url)
                    min_followers_count = 850000
                    
                    # Lower threshold for US-based jobs
                    if self._is_location_in_usa(location):
                        min_followers_count = 750000
                    
                    if followers_count >= min_followers_count:
                        self.logger.info(f"Adding job: {company_name} - {job_title} - {followers_count} followers")
                        job_list.append({
                            "title": job_title,
                            "company": company_name,
                            "location": location,
                            "url": job_link,
                            "posted_date": posted_date,
                            "actively_hiring": actively_hiring,
                            "source": "linkedin",
                            "followers_count": followers_count
                        })
                    else:
                        self.logger.debug(f"Skipping job with low follower count: {company_name} - {followers_count} followers")
            except Exception as e:
                self.logger.error(f"Error processing job element: {str(e)}")
        
        return job_list
    
    async def _get_company_follower_count(self, company_url: str, attempt: int = 0) -> int:
        """
        Get follower count for a LinkedIn company page.
        
        Args:
            company_url: URL of the company LinkedIn page
            attempt: Current retry attempt number
            
        Returns:
            Follower count (or default value)
        """
        # Check blacklist
        blacklist = await self._read_blacklist_from_file()
        if company_url in blacklist:
            return 0
        
        # Check whitelist
        whitelist = await self._read_whitelist_from_file()
        if company_url in whitelist:
            return 1000000
        
        # Check if we have cached follower count
        followers_data = await self._read_followers_from_file()
        if company_url in followers_data:
            return followers_data[company_url]
        
        self.logger.info(f"Fetching follower count for: {company_url}")
        
        try:
            status, html = await self.request_handler.get(company_url)
            
            # Parse HTML to find follower count
            soup = BeautifulSoup(html, 'lxml')
            follower_subline = soup.select_one('h3.top-card-layout__first-subline')
            
            if not follower_subline:
                await self._write_to_templist(company_url)
                return 1000000
            
            follower_text = follower_subline.get_text().strip()
            followers_match = re.search(r'([\d,]+) followers', follower_text)
            
            if not followers_match:
                await self._write_to_templist(company_url)
                return 1000000
            
            # Parse follower count
            followers_count = int(followers_match.group(1).replace(',', ''))
            
            # Cache the result
            await self._write_followers_to_file(company_url, followers_count)
            
            return followers_count
            
        except Exception as e:
            self.logger.error(f"Error fetching follower count: {str(e)}")
            
            if attempt >= 3:
                await self._write_to_templist(company_url)
                self.logger.warning(f"Adding {company_url} to templist after multiple failures")
                return 1000000
            
            # Exponential backoff retry
            delay = min(150, 30 * (2 ** attempt))
            self.logger.info(f"Retrying after {delay}s (attempt {attempt+1}/3)")
            await asyncio.sleep(delay)
            return await self._get_company_follower_count(company_url, attempt + 1)
    
    def _is_location_in_usa(self, location: str) -> bool:
        """
        Check if a job location is in the USA.
        
        Args:
            location: Location string from job listing
            
        Returns:
            Boolean indicating if location is in USA
        """
        location = location.lower()
        return (
            any(state.lower() in location for state in self.us_states) or
            any(abbr.lower() in location for abbr in self.us_state_abbrs) or
            "united states" in location or
            "usa" in location or 
            "u.s." in location
        )
    
    def _remove_query_params(self, url: str) -> str:
        """
        Remove query parameters from URL.
        
        Args:
            url: URL with potential query parameters
            
        Returns:
            URL with query parameters removed
        """
        try:
            parsed = urlparse(url)
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        except Exception:
            self.logger.error(f"Invalid URL: {url}")
            return url
    
    async def _read_followers_from_file(self) -> Dict[str, int]:
        """
        Read cached follower counts from file.
        
        Returns:
            Dictionary of company URLs to follower counts
        """
        try:
            # Ensure file exists
            if not self.followers_file.exists():
                self.followers_file.touch()
                return {}
            
            followers_data = {}
            content = self.followers_file.read_text('utf-8')
            
            for line in content.splitlines():
                if not line.strip():
                    continue
                    
                parts = line.split(',')
                if len(parts) == 2:
                    url, count = parts
                    if url and count:
                        followers_data[url] = int(count.strip())
            
            return followers_data
        except Exception as e:
            self.logger.error(f"Error reading followers file: {str(e)}")
            return {}
    
    async def _write_followers_to_file(self, company_url: str, follower_count: int) -> None:
        """
        Write company follower count to cache file.
        
        Args:
            company_url: Company LinkedIn URL
            follower_count: Number of followers
        """
        try:
            with self.followers_file.open('a', encoding='utf-8') as f:
                f.write(f"{company_url},{follower_count}\n")
        except Exception as e:
            self.logger.error(f"Error writing to followers file: {str(e)}")
    
    async def _read_blacklist_from_file(self) -> Set[str]:
        """
        Read blacklisted company URLs from file.
        
        Returns:
            Set of blacklisted company URLs
        """
        try:
            if not self.blacklist_file.exists():
                self.blacklist_file.touch()
                return set()
                
            content = self.blacklist_file.read_text('utf-8')
            return set(line.strip() for line in content.splitlines() if line.strip())
        except Exception as e:
            self.logger.error(f"Error reading blacklist file: {str(e)}")
            return set()
    
    async def _read_whitelist_from_file(self) -> Set[str]:
        """
        Read whitelisted company URLs from file.
        
        Returns:
            Set of whitelisted company URLs
        """
        try:
            if not self.whitelist_file.exists():
                self.whitelist_file.touch()
                return set()
                
            content = self.whitelist_file.read_text('utf-8')
            return set(line.strip() for line in content.splitlines() if line.strip())
        except Exception as e:
            self.logger.error(f"Error reading whitelist file: {str(e)}")
            return set()
    
    async def _write_to_templist(self, company_url: str) -> None:
        """
        Add company URL to templist for manual review.
        
        Args:
            company_url: Company LinkedIn URL
        """
        try:
            with self.templist_file.open('a', encoding='utf-8') as f:
                f.write(f"{company_url}\n")
        except Exception as e:
            self.logger.error(f"Error writing to templist file: {str(e)}") 