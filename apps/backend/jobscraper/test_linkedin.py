#!/usr/bin/env python3
"""
Test script specifically for the LinkedIn scraper.
"""
import asyncio
import logging
import json
import argparse
import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to allow imports to work
sys.path.append(str(Path(__file__).parent))

# Import using a relative path that works when run from the jobscraper directory
from scrapers.linkedin import LinkedInScraper

async def test_linkedin_scraper(output_file=None, keyword=None, verbose=False):
    """
    Run a test of the LinkedIn scraper.
    
    Args:
        output_file: Optional file to save results
        keyword: Optional specific keyword to test
        verbose: Whether to enable debug logging
    """
    # Set up logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create data directory if it doesn't exist
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    print("Initializing LinkedIn scraper...")
    scraper = LinkedInScraper()
    
    # If a specific keyword was provided, override the default job roles
    if keyword:
        scraper.job_roles = [keyword]
        print(f"Testing with specific keyword: {keyword}")
    else:
        print(f"Testing with {len(scraper.job_roles)} job roles: {', '.join(scraper.job_roles)}")
    
    print("\nStarting LinkedIn scraper test...")
    
    try:
        jobs = await scraper.run()
        
        print(f"\nScraped {len(jobs)} total jobs")
        
        # Print sample jobs
        if jobs:
            print("\nSample jobs:")
            for i, job in enumerate(jobs[:5], 1):
                print(f"\n{i}. {job['title']} at {job['company']}")
                print(f"   Location: {job['location']}")
                print(f"   URL: {job['url']}")
                print(f"   Company followers: {job.get('followers_count', 'Unknown')}")
        
        # Save to file if requested
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(jobs, f, indent=2)
            print(f"\nSaved {len(jobs)} jobs to {output_file}")
            
    except Exception as e:
        print(f"Error running LinkedIn scraper: {str(e)}")

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Test the LinkedIn scraper")
    parser.add_argument("--output", "-o", type=str, help="Output file for scraped jobs (JSON)")
    parser.add_argument("--keyword", "-k", type=str, help="Specific keyword to test")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    asyncio.run(test_linkedin_scraper(
        output_file=args.output, 
        keyword=args.keyword,
        verbose=args.verbose
    )) 