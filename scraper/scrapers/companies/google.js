import { runScraper } from '../utils/scrape.js';
import { getScraperStatus } from '../utils/status.js';

const googleSelectors = {
  list: 'li.lLd3Je',
  title: 'h3.QJPWVe',
  link: 'a.WpHeLc.VfPpkd-mRLv6[jsname="hSRGPd"]',
  companyName: 'Google',
};

export const GoogleScraper = async () => {
  await runScraper(
    'Google',
    'https://www.google.com/about/careers/applications/jobs/results?skills=software&sort_by=date&target_level=INTERN_AND_APPRENTICE',
    googleSelectors,
    'a.WpHeLc.VfPpkd-mRLv6[jsname="hSRGPd"][aria-label="Go to next page"]',
  );
};

export const getGoogleScraperStatus = async (overrideStatus = null) => {
  return await getScraperStatus(
    'Google',
    'https://www.google.com/about/careers/applications/jobs/results?skills=software&sort_by=date&target_level=INTERN_AND_APPRENTICE',
    'li.lLd3Je',
  );
};
