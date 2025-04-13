import fetch from 'node-fetch';
import moment from 'moment';
import { randomDelay, exponentialBackoffDelay } from '../utils/delay.js';
import { saveJob } from '../utils/database.js';

const extractJobsFromHTML = (html) => {
  const tableHeader = "| Company | Role | Location | Application/Link | Date Posted |";
  const startIndex = html.indexOf(tableHeader);
  if (startIndex === -1) return [];

  const tableContent = html.slice(startIndex);
  const lines = tableContent.split("\n").map(line => line.trim()).filter(Boolean);
  const contentLines = lines.slice(2).filter(line => line.startsWith('|'));

  const jobs = [];
  let lastCompanyName = "";

  contentLines.forEach(line => {
    const regex = /\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/;
    const match = regex.exec(line);

    if (match) {
      const companyName = match[1].includes('↳') ? lastCompanyName : match[1].trim();
      const jobTitle = match[2].trim();
      const jobLink = match[4].trim();
      const datePosted = match[5].trim();

      // Skip rows where jobLink contains 🔒
      if (jobLink.includes('🔒')) return;

      // Extract the relevant link from the <a href="...">
      const linkMatch = /<a href="(.*?)">/.exec(jobLink);
      const extractedLink = linkMatch ? linkMatch[1].split('?')[0] : null;

      if (!line.includes("↳")) {
        lastCompanyName = companyName;
      }

      if (extractedLink) {
        jobs.push({
          companyName,
          jobTitle,
          jobLink: extractedLink,
          datePosted,
        });
      }
    }
  });

  return filterJobsFromLastTwoWeeks(jobs);
};

const filterJobsFromLastTwoWeeks = (jobs) => {
  const twoWeeksAgo = moment().subtract(2, 'weeks');

  return jobs.filter((job) => {
    let jobDate = moment(job.datePosted, 'MMM DD').year(moment().year());
    if (jobDate.isAfter(moment())) {
      jobDate = jobDate.subtract(1, 'year');
    }
    return jobDate.isAfter(twoWeeksAgo);
  });
};


const fetchFileContent = async (filePath, attempt = 0) => {
  const url = `https://api.github.com/repos/cvrve/Summer2025-Internships/contents/${filePath}?ref=dev`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JobStream/1.0 (https://github.com/cvrve/Summer2025-Internships)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}. Status code: ${response.status}`);
    }

    const data = await response.json();
    const html = Buffer.from(data.content, 'base64').toString('utf-8');
    const jobs = extractJobsFromHTML(html);

    for (const job of jobs) {
        if (job.companyName && job.jobTitle && job.jobLink) {
        await saveJob(job);
        console.log(`\x1b[94mJOB (CvrveScraper): [${job.companyName}, ${job.jobTitle}, ${job.jobLink}]\x1b[0m`);
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

export const CvrveScraper = async () => {
  try {
    await randomDelay(5000, 15000);
    await fetchFileContent('OFFSEASON_README.md');
    
    await randomDelay(5000, 15000);
    await fetchFileContent('README.md');
    
  } catch (error) {
    console.error('\x1b[41m\x1b[30mError during scraping:\x1b[0m', error.message);
  }
};

let cvrveStatus = 'error';
let cvrveLastScrapeTime = 0;
const ONE_HOUR = 60 * 60 * 1000;

const cacheScrapeTime = () => {
  cvrveLastScrapeTime = Date.now();
};

const shouldRefetch = () => {
  const currentTime = Date.now();
  return currentTime - cvrveLastScrapeTime > ONE_HOUR;
};

const fetchReadme = async () => {
  const url = `https://api.github.com/repos/cvrve/Summer2025-Internships/contents/README.md`;
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
    console.error(`Error fetching README from cvrve:`, error.message);
    return 'error';
  }
};

export const getCvrveScraperStatus = async () => {
  if (cvrveStatus === 'success' && !shouldRefetch()) {
    return 'success';
  }
  
  const result = await fetchReadme();
  
  if (result === 'success') {
    cvrveStatus = 'success';
    cacheScrapeTime();
  } else {
    cvrveStatus = 'error';
  }

  return cvrveStatus;
};
