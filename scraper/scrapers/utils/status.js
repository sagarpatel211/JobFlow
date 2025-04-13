import { OrganizationStatus } from '../../database/model.js';
import { launchBrowser } from './browser.js';

export const getScraperStatus = async (
  organizationName,
  siteUrl,
  listItemSelector,
  overrideStatus = null,
) => {
  try {
    let statusEntry = await OrganizationStatus.findOne({
      where: { organizationName },
    });
    if (!statusEntry) {
      statusEntry = await OrganizationStatus.create({
        organizationName,
        status: 'pending',
        lastScrapeTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      });
    }
    if (overrideStatus !== null) {
      await statusEntry.update({
        status: overrideStatus ? 'success' : 'error',
        lastScrapeTime: new Date(),
      });
      return statusEntry.status;
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (
      statusEntry.lastScrapeTime > twoHoursAgo &&
      statusEntry.status !== 'error'
    ) {
      console.log(`Using cached status for ${organizationName}...`);
      return statusEntry.status;
    } else {
      console.log(`Checking status for ${organizationName}...`);
    }
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(siteUrl, { waitUntil: 'networkidle2' });
    const elementVisible = await page.waitForSelector(listItemSelector, {
      visible: true,
      timeout: 10000,
    });
    const newStatus = elementVisible ? 'success' : 'error';
    await statusEntry.update({ status: newStatus, lastScrapeTime: new Date() });
    await browser.close();
    return newStatus;
  } catch (error) {
    console.error(
      `Error during status check for ${organizationName}:`,
      error.message.includes('exceeded')
        ? error.message.substring(
            0,
            error.message.indexOf('exceeded') + 'exceeded'.length,
          )
        : error.message,
    );
    await OrganizationStatus.update(
      { status: 'error', lastScrapeTime: new Date() },
      { where: { organizationName } },
    );
    return 'error';
  }
};

export const updateScraperStatus = async (organizationName, status) => {
  try {
    await OrganizationStatus.update(
      { status, lastScrapeTime: new Date() },
      { where: { organizationName } },
    );
  } catch (error) {
    console.error(`Error updating status for ${organizationName}:`, error);
  }
};
