import { launchBrowser, navigateToPage, clickNextPage } from './browser.js';
import { saveJob } from './database.js';
import { getScraperStatus, updateScraperStatus } from './status.js';

function randomDelay(min, max) {
  return new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
  );
}

export const runScraper = async (
  organizationName,
  siteUrl,
  jobSelectors,
  nextPageSelector,
  jobIdSelector = '',
  customJobLink = '',
) => {
  try {
    const currentStatus = await getScraperStatus(organizationName);
    if (currentStatus === 'error') return currentStatus;
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    );

    await navigateToPage(page, siteUrl);

    let hasNextPage = true;
    while (hasNextPage) {
      try {
        await page.waitForSelector(jobSelectors.list, {
          visible: true,
          timeout: 10000,
        });
        const jobListings = await page.evaluate(
          (selectors, jobIdSelector, customJobLink) => {
            const jobs = Array.from(document.querySelectorAll(selectors.list));
            return jobs.map(job => {
              let companyName = selectors.companyName;
              let jobTitle =
                job.querySelector(selectors.title)?.innerText ||
                'Unknown Title';
              let jobLink =
                job.querySelector(selectors.link)?.href || 'No Link';
              if (jobIdSelector !== '' && customJobLink !== '') {
                const jobId = job
                  .querySelector(jobIdSelector)
                  ?.getAttribute('aria-label')
                  ?.match(/\d+/)?.[0];
                jobLink = customJobLink.replace('{jobId}', jobId);
              }
              return { companyName, jobTitle, jobLink };
            });
          },
          jobSelectors,
          jobIdSelector,
          customJobLink,
        );

        for (const job of jobListings) {
          if (job.companyName && job.jobTitle && job.jobLink) {
            console.log(`\x1b[94mJOB: [${job.companyName}, ${job.jobTitle}]\x1b[0m`);
            //await saveJob(job);
          } else {
            console.warn(
              'Skipping job due to missing fields. JOB: [' +
                job.companyName +
                ', ' +
                job.jobTitle +
                ']',
            );
          }
        }
        if (nextPageSelector === '') {
          hasNextPage = false;
          return;
        }
        hasNextPage = await clickNextPage(page, nextPageSelector);
        await randomDelay(3000, 7000);
      } catch (pageError) {
        console.error(
          `Error scraping page for ${organizationName}:`,
          pageError,
        );
        await updateScraperStatus(organizationName, 'error');
        hasNextPage = false;
      }
    }
    await browser.close();
    await updateScraperStatus(organizationName, 'success');
  } catch (error) {
    console.error(`Error during ${organizationName} scraper execution:`, error);
    await updateScraperStatus(organizationName, 'error');
  }
};
