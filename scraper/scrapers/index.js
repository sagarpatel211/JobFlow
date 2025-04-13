import { GoogleScraper, getGoogleScraperStatus } from './companies/google.js';
import { TiktokScraper, getTiktokScraperStatus } from './companies/tiktok.js';
import { MicrosoftScraper, getMicrosoftScraperStatus } from './companies/microsoft.js';
import { LinkedinScraper, getLinkedinScraperStatus } from './jobsites/linkedin.js';
import { CvrveScraper, getCvrveScraperStatus } from './github-links/cvrve.js';
import { SpeedyApplyScraper, getSpeedyApplyScraperStatus } from './github-links/speedyapply.js';
import { SimplifyScraper, getSimplifyScraperStatus } from './github-links/simplify.js';

const scrapersConfig = [
  { name: 'google', scraper: GoogleScraper, getStatus: getGoogleScraperStatus },
  // { name: 'tiktok', scraper: TiktokScraper, getStatus: getTiktokScraperStatus },
  { name: 'microsoft', scraper: MicrosoftScraper, getStatus: getMicrosoftScraperStatus },
  { name: 'linkedin', scraper: LinkedinScraper, getStatus: getLinkedinScraperStatus },
  { name: 'cvrve', scraper: CvrveScraper, getStatus: getCvrveScraperStatus },
  { name: 'speedyapply', scraper: SpeedyApplyScraper, getStatus: getSpeedyApplyScraperStatus },
  { name: 'simplify', scraper: SimplifyScraper, getStatus: getSimplifyScraperStatus },
];

const randomDelay = () => Math.floor(Math.random() * (60 * 60 * 1000));

const runScraperWithDelay = async (scraperConfig, disableDelay = false) => {
  const { scraper, name } = scraperConfig;
  if (!disableDelay) {
    const delay = randomDelay();
    console.log(`Waiting for ${delay / 1000 / 60 / 60} hours before running ${name}...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  await scraper();
};

export const checkAllScrapers = async () => {
  const scrapersStatus = {};
  for (const { name, getStatus } of scrapersConfig) {
    try {
      const status = await getStatus();
      scrapersStatus[name] = status;
    } catch (error) {
      scrapersStatus[name] = 'error';
    }
  }
  return scrapersStatus;
};

export const runAllScrapers = async (disableDelay = false) => {
  const startTime = Date.now();
  const scraperPromises = scrapersConfig.map((scraperConfig) =>
    runScraperWithDelay(scraperConfig, disableDelay)
  );
  const results = await Promise.all(scraperPromises);
  console.log(`\x1b[92m|=============================|\x1b[0m`);
  console.log(`\x1b[92m|Finished running all scrapers|\x1b[0m`);
  console.log(`\x1b[92m|=============================|\x1b[0m`);
  const endTime = Date.now();
  const timeTakenMs = endTime - startTime;
  const timeTakenHours = (timeTakenMs / 1000 / 60 / 60).toFixed(2);
  console.log(`\x1b[92m|   Scraping took ${timeTakenHours} hours  |\x1b[0m`);
  console.log(`\x1b[92m|=============================|\x1b[0m`);
  return results.flat();
};
