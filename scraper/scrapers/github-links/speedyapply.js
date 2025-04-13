import fetch from 'node-fetch';
import moment from 'moment';
import { saveJob } from '../utils/database.js';
import { randomDelay, exponentialBackoffDelay } from '../utils/delay.js';

const extractJobsFromHTML = (html, isInternational = false) => {
  const tableHeader = isInternational
    ? "| Company | Position | Location | Posting | Age |"
    : "| Company | Position | Location | Salary | Posting | Age |";

  // Split the content into sections by table header
  const sections = html.split(tableHeader).slice(1); // Skip the part before the first table

  const jobs = [];

  sections.forEach(section => {
    const lines = section.split("\n").map(line => line.trim()).filter(Boolean);

    let skipNextLine = true; // Skip the line right after the header
    lines.forEach(line => {
      if (skipNextLine) {
        skipNextLine = false; // Reset skipNextLine after skipping the separator
        return; // Skip the first line (e.g., "|---|---|---|")
      }

      if (isInternational) { // Process International format
        const regex = /\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/;
        const match = regex.exec(line);

        if (match) {
          const rawCompanyName = match[1].trim();
          const companyMatch = /<strong>(.*?)<\/strong>/.exec(rawCompanyName);
          const companyName = companyMatch ? companyMatch[1].trim() : rawCompanyName;

          const jobTitle = match[2].trim();
          const rawJobLink = match[4].trim();
          const hrefMatch = /href="([^"]+)"/.exec(rawJobLink);
          const jobLink = hrefMatch ? hrefMatch[1] : null;
          const datePosted = match[5].trim();

          const ageMatch = /^([0-9]+)([d|w])$/i.exec(datePosted);
          if (ageMatch) {
            const number = parseInt(ageMatch[1], 10);
            const unit = ageMatch[2].toLowerCase();
            if ((unit === 'd' && number > 14) || (unit === 'w' && number * 7 > 14)) {
              return;
            }
          }

          if (companyName && jobTitle && jobLink) {
            jobs.push({
              companyName,
              jobTitle,
              jobLink,
              datePosted: moment().format('MMM DD'),
            });
          }
        }
      } else { // Process Standard format
        const regex = /\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/;
        const match = regex.exec(line);

        if (match) {
          const rawCompanyName = match[1].trim();
          const companyMatch = /<strong>(.*?)<\/strong>/.exec(rawCompanyName);
          const companyName = companyMatch ? companyMatch[1].trim() : rawCompanyName;

          const jobTitle = match[2].trim();
          const rawJobLink = match[5].trim();
          const hrefMatch = /href="([^"]+)"/.exec(rawJobLink);
          const jobLink = hrefMatch ? hrefMatch[1] : null;
          const datePosted = match[6].trim();

          // Age filtering: Skip jobs older than 14 days or 2 weeks
          const ageMatch = /^([0-9]+)([d|w])$/i.exec(datePosted);
          if (ageMatch) {
            const number = parseInt(ageMatch[1], 10);
            const unit = ageMatch[2].toLowerCase();
            if ((unit === 'd' && number > 7) || (unit === 'w' && number * 7 > 7)) {
              return;
            }
          }

          if (companyName && jobTitle && jobLink) {
            jobs.push({
              companyName,
              jobTitle,
              jobLink,
              datePosted: moment().format('MMM DD'),
            });
          }
        }
      }
    });
  });

  return jobs;
};


const fetchFileContent = async (filePath, attempt = 0) => {
  const url = `https://api.github.com/repos/speedyapply/2025-SWE-College-Jobs/contents/${filePath}?ref=main`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JobStream/1.0 (https://github.com/sagarpatel211)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}. Status code: ${response.status}`);
    }

    const data = await response.json();
    const html = Buffer.from(data.content, 'base64').toString('utf-8');
    const isInternational = filePath === 'INTERN_INTL.md';
    const jobs = extractJobsFromHTML(html, isInternational);
    
    for (const job of jobs) {
      if (job.companyName && job.jobTitle && job.jobLink) {
        await saveJob(job);
        console.log(`\x1b[94mJOB (SpeedyApply): [${job.companyName}, ${job.jobTitle}, ${job.jobLink}]\x1b[0m`);
      }
    }

  } catch (error) {
    console.error(`\x1b[41m\x1b[30mError fetching ${filePath}: ${error.message}\x1b[0m`);

    if (attempt < 5) {
      console.log(`\x1b[31mRetrying ${filePath} (Attempt ${attempt + 1})...\x1b[0m`);
      await exponentialBackoffDelay(attempt);
      return fetchFileContent(filePath, attempt + 1);
    } else {
      console.error(`\x1b[41m\x1b[30mFailed to fetch ${filePath} after 5 attempts.\x1b[0m`);
    }
  }
};

export const SpeedyApplyScraper = async () => {
  try {
    await randomDelay(5000, 15000);
    await fetchFileContent('INTERN_INTL.md');
    
    await randomDelay(5000, 15000);
    await fetchFileContent('README.md');

  } catch (error) {
    console.error('\x1b[41m\x1b[30mError during scraping:\x1b[0m', error.message);
  }
};

let speedyApplyStatus = 'error';
let speedyApplyLastScrapeTime = 0;
const ONE_HOUR = 60 * 60 * 1000;

const cacheScrapeTime = () => {
  speedyApplyLastScrapeTime = Date.now();
};

const shouldRefetch = () => {
  const currentTime = Date.now();
  return currentTime - speedyApplyLastScrapeTime > ONE_HOUR;
};

const fetchReadme = async () => {
  const url = `https://api.github.com/repos/speedyapply/2025-SWE-College-Jobs/contents/README.md`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JobStream/1.0 (https://github.com/sagarpatel211)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the README. Status code: ${response.status}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    if (content) {
      return 'success';
    } else {
      return 'error';
    }
  } catch (error) {
    console.error(`Error fetching README from speedyapply:`, error.message);
    return 'error';
  }
};

export const getSpeedyApplyScraperStatus = async () => {
  if (speedyApplyStatus === 'success' && !shouldRefetch()) {
    return 'success';
  }
  
  const result = await fetchReadme();
  
  if (result === 'success') {
    speedyApplyStatus = 'success';
    cacheScrapeTime();
  } else {
    speedyApplyStatus = 'error';
  }

  return speedyApplyStatus;
};
