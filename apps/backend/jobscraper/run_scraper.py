#!/usr/bin/env python3
"""
Command-line runner for the job scraper.
"""
import asyncio
import argparse
import logging
import json
from scraper import start_scrape_job, cancel_scrape_job, get_scrape_status

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run job scrapers")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    parser.add_argument("--output", "-o", type=str, help="Output file for scraped jobs (JSON)")
    return parser.parse_args()

async def main():
    """Run the scraper and output results."""
    args = parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("Starting job scraper...")
    
    try:
        # Run the scraper
        jobs = await start_scrape_job()
        
        # Print results
        print(f"\nScraped {len(jobs)} jobs")
        
        # Print sample of jobs to console
        for job in jobs[:5]:  # Show first 5 jobs
            print(f"\n{job['title']} at {job['company']} - {job['location']}")
            print(f"URL: {job['url']}")
        
        if len(jobs) > 5:
            print(f"\n... and {len(jobs) - 5} more jobs")
            
        # Save to file if output specified
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(jobs, f, indent=2)
            print(f"\nSaved {len(jobs)} jobs to {args.output}")
            
    except KeyboardInterrupt:
        print("\nScraper interrupted. Shutting down...")
        cancel_scrape_job()
    except Exception as e:
        print(f"\nError running scraper: {str(e)}")
    
    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main()) 