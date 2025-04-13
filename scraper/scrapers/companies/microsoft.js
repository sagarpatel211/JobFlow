import { runScraper } from '../utils/scrape.js';
import { getScraperStatus } from '../utils/status.js';

const microsoftSelectors = {
  list: 'div.ms-List-cell',
  title: 'h2.MZGzlrn8gfgSs8TZHhv2',
  link: null,
  companyName: 'Microsoft',
};

export const MicrosoftScraper = async () => {
  await runScraper(
    'Microsoft',
    'https://jobs.careers.microsoft.com/global/en/search?p=Research%2C%20Applied%2C%20%26%20Data%20Sciences&p=Software%20Engineering&p=Security%20Engineering&et=Internship&l=en_us&pg=1&pgSz=20&o=Relevance&flt=true',
    microsoftSelectors,
    'button[aria-label="Go to next page"]',
    'div[aria-label^="Job item"]',
    'https://jobs.careers.microsoft.com/global/en/job/{jobId}/',
  );
};

export const getMicrosoftScraperStatus = async (overrideStatus = null) => {
  return await getScraperStatus(
    'Microsoft',
    'https://jobs.careers.microsoft.com/global/en/search?p=Software%20Engineering&et=Internship',
    'div.ms-List-page',
  );
};
