# Job Scraper

A modular Python job scraper built for scraping job listings from various sources.

## Features

- Modular architecture allowing easy addition of new scrapers
- Built-in rate limiting and backoff strategies for API courtesy
- Robust error handling and retry mechanisms
- Asynchronous implementation for efficient scraping
- Command-line interface for running scrapers
- Specialized LinkedIn scraper with company follower filtering and location awareness

## Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Command Line

Run the scraper directly from the command line:

```bash
python run_scraper.py --output jobs.json
```

Options:
- `--verbose`, `-v`: Enable verbose logging
- `--output`, `-o`: Output file for scraped jobs (JSON)

### Testing the LinkedIn Scraper

You can specifically test the LinkedIn scraper with:

```bash
python test_linkedin.py --output linkedin_jobs.json
```

Options:
- `--verbose`, `-v`: Enable verbose logging
- `--output`, `-o`: Output file for scraped jobs (JSON)
- `--keyword`, `-k`: Specific job keyword to search (e.g. "python developer")

### Programmatic Usage

```python
import asyncio
from scraper import start_scrape_job

async def main():
    jobs = await start_scrape_job()
    print(f"Scraped {len(jobs)} jobs")
    
    for job in jobs:
        print(f"{job['title']} at {job['company']}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Architecture

The scraper is built with a modular design:

- `scraper.py`: Core functionality including rate limiting, backoff, and request handling
- `scrapers/`: Directory containing individual scraper implementations
  - `linkedin.py`: Advanced LinkedIn scraper with company follower filtering 
  - `github.py`: GitHub jobs scraper
  - (Add more scrapers here)
- `run_scraper.py`: Command-line interface for running scrapers
- `test_linkedin.py`: Specific testing tool for LinkedIn scraper

### LinkedIn Scraper Features

The LinkedIn scraper has several advanced features:

1. **Company Follower Filtering**: Only shows jobs from companies with substantial LinkedIn followings (configurable thresholds)
2. **Location-Based Filtering**: Applies different follower thresholds for US-based jobs
3. **Caching System**: Caches company follower counts to reduce API requests
4. **Blacklist/Whitelist**: Maintains lists of companies to automatically include or exclude
5. **Pagination Handling**: Navigates through multiple pages of search results
6. **Rate Limiting**: Implements conservative rate limiting to avoid IP blocking

### Adding a New Scraper

1. Create a new file in the `scrapers/` directory (e.g., `scrapers/example.py`)
2. Implement a scraper class that inherits from `BaseScraper`
3. Register your scraper in the `ScraperManager.register_scrapers` method in `scraper.py`

Example:

```python
from ..scraper import BaseScraper

class ExampleScraper(BaseScraper):
    def __init__(self):
        super().__init__("example")
        
    async def scrape(self):
        # Implement scraping logic here
        return []
```

## Rate Limiting and Backoff

The scraper implements the following strategies for polite scraping:

1. **Token Bucket Rate Limiting**: Controls the rate of requests to avoid overwhelming services
2. **Exponential Backoff**: Intelligently retries failed requests with increasing delays
3. **Jitter**: Adds randomization to delay times to avoid request clustering

## Extending the Scraper

The modular design makes it easy to extend the scraper with new functionality:

1. **New Data Sources**: Add new scraper implementations in the `scrapers/` directory
2. **Enhanced Parsing**: Improve HTML/data parsing by updating scraper implementations
3. **Additional Output Formats**: Modify the output handlers in `run_scraper.py`
