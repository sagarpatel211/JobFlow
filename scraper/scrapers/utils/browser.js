import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const launchBrowser = async () => {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"',
    ],
  });
};

export const navigateToPage = async (page, url) => {
  await page.goto(url, { waitUntil: 'networkidle2' });
};

export const clickNextPage = async (page, selector) => {
  try {
    const nextPageButton = await page.$(selector);
    if (nextPageButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        nextPageButton.click(),
      ]);
      await new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * 15000) + 10000),
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error clicking next page! Ending this page scrape...');
    return false;
  }
};
