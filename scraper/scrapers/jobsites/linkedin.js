import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { saveJob } from '../utils/database.js';
import fs from 'fs/promises';
import path from 'path';
import randomUseragent from 'random-useragent';
import PQueue from 'p-queue';
import { chromium } from 'playwright';

const followersFilePath = path.resolve('followers.txt');
const blacklistFilePath = path.resolve('blacklist.txt');
const whitelistFilePath = path.resolve('whitelist.txt');
const templistFilePath = path.resolve('templist.txt');
const MAX_CONCURRENT_REQUESTS = 1;
const fetchQueue = new PQueue({ concurrency: MAX_CONCURRENT_REQUESTS });

const ensureFollowersFileExists = async () => {
  try {
    await fs.access(followersFilePath);
  } catch (error) {
    console.log('Followers file does not exist. Creating a new one...');
    await fs.writeFile(followersFilePath, '', 'utf-8');
  }
};

const readFollowersFromFile = async () => {
  await ensureFollowersFileExists();
  try {
    const fileContent = await fs.readFile(followersFilePath, 'utf-8');
    const lines = fileContent.split('\n');
    const followersData = {};
    lines.forEach(line => {
      const [url, count] = line.split(',');
      if (url && count) {
        followersData[url] = parseInt(count.trim(), 10);
      }
    });
    return followersData;
  } catch (error) {
    console.error('Error reading followers file:', error);
    return {};
  }
};

const writeFollowersToFile = async (companyUrl, followerCount) => {
  try {
    const newEntry = `${companyUrl},${followerCount}\n`;
    await fs.appendFile(followersFilePath, newEntry, 'utf-8');
  } catch (error) {
    console.error('Error writing to followers file:', error);
  }
};

const readBlacklistFromFile = async () => {
  try {
    const fileContent = await fs.readFile(blacklistFilePath, 'utf-8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(Boolean);
    return new Set(lines);
  } catch (error) {
    console.error('Error reading blacklist file:', error);
    return new Set();
  }
};

const readWhitelistFromFile = async () => {
  try {
    const fileContent = await fs.readFile(whitelistFilePath, 'utf-8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(Boolean);
    return new Set(lines);
  } catch (error) {
    console.error('Error reading whitelist file:', error);
    return new Set();
  }
};

const writeTempListToFile = async (companyUrl) => {
  try {
    await fs.appendFile(templistFilePath, companyUrl + '\n', 'utf-8');
  } catch (error) {
    console.error('Error writing to templist file:', error);
  }
};

const randomDelay = (min = 500, max = 20000) =>
  new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
  );

const asyncRandomDelay = async (min = 500, max = 30000) => {
  await randomDelay(min, max);
};

const exponentialBackoffDelay = async attempt => {
  const delayTime = Math.min(30000 * 2 ** attempt, 150000);
  await new Promise(resolve => setTimeout(resolve, delayTime));
};

const getCompanyFollowerCount = async (companyUrl, attempt = 0) => {
  const followersData = await readFollowersFromFile();
  const blacklist = await readBlacklistFromFile();
  const whitelist = await readWhitelistFromFile();
  if (blacklist.has(companyUrl)) {
    return 0;
  }
  if (whitelist.has(companyUrl)) {
    return 1000000;
  }
  if (followersData[companyUrl]) {
    return followersData[companyUrl];
  }
  console.log('Fetching Followers for:', companyUrl);
  try {
    const response = await fetch(companyUrl);
    if (response.status === 429) {
      console.log(`\x1b[41m\x1b[30mRate limited on Attempt ${attempt} for ${companyUrl}. Retrying after delay...\x1b[0m`);
      await exponentialBackoffDelay(attempt);
      return getCompanyFollowerCount(companyUrl, attempt + 1);
    }
    if (response.status === 400 || response.status === 404) {
      console.log(`\x1b[90mCompany ${companyUrl} returned a ${response.status} status code. Skipping...\x1b[0m`);
      await writeTempListToFile(companyUrl);
      return 1000000;
    }
    if (!response.ok) {
      if (attempt == 3) {
        await writeTempListToFile(companyUrl);
        console.log(`\x1b[41m\x1b[30mError on Attempt ${attempt} for ${companyUrl}. Added to templist for manual inspection.\x1b[0m`);
        return 1000000;
      }
      console.log(`\x1b[41m\x1b[30mError on Attempt ${attempt} for ${companyUrl}. Retrying after delay...\x1b[0m`);
      await exponentialBackoffDelay(attempt);
      return getCompanyFollowerCount(companyUrl, attempt + 1);
    }
    attempt = 0;
    const html = await response.text();
    const $ = cheerio.load(html);
    const followerText = $('h3.top-card-layout__first-subline').text().trim();
    if (!followerText) {
      await writeTempListToFile(companyUrl);
      return 1000000;
    }
    const followersMatch = followerText.match(/[\d,]+ followers/);
    if (!followersMatch) {
      await writeTempListToFile(companyUrl);
      return 1000000;
    }
    const followersCount = parseInt(followersMatch[0].replace(/[^\d]/g, ''), 10);
    await writeFollowersToFile(companyUrl, followersCount);
    return followersCount;
  } catch (error) {
    console.error('Error fetching follower count:', error);
    return 0;
  }
};

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "District of Columbia", "D.C.", "DC"
];
const usStateAbbreviations = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
  "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN",
  "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const isLocationInUSA = location => {
  return (
    usStates.some(state => location.includes(state)) ||
    usStateAbbreviations.some(abbr => location.includes(abbr)) ||
    location.includes("United States") ||
    location.includes("USA") || location.includes("U.S.")
  );
};

const extractJobDetails = async html => {
  if (!html) return [];
  const $ = cheerio.load(html);
  const jobList = [];
  const jobElements = $('li div.base-card--link.job-search-card');
  console.log(`\x1b[35mFound ${jobElements.length} Jobs!\x1b[0m`);
  for (let index = 0; index < jobElements.length; index++) {
    const element = jobElements[index];
    const jobLink = $(element).find('.base-card__full-link').attr('href') || '';
    if (jobLink) {
      const companyElement = $(element).find('.hidden-nested-link');
      const companyUrl = companyElement.attr('href') || '';
      const companyName = companyElement.text().trim() || 'No Company';
      const postedDate = new Date(
        $(element).find('.job-search-card__listdate').attr('datetime'),
      );
      const jobTitle =
            $(element).find('.base-search-card__title').text().trim() ||
            'No Title';
      const location =
            $(element).find('.job-search-card__location').text().trim() || 'No Location';
      if (companyUrl) {
        const followersCount = await getCompanyFollowerCount(companyUrl);
        let minFollowersCount = 850000;
        if (isLocationInUSA(location)) {
          minFollowersCount = 750000;
        }
        if (followersCount >= minFollowersCount) {
          console.log(`\x1b[94mJOB: [${companyName}, ${jobTitle}, ${followersCount}]\x1b[0m`);
          jobList.push({
            jobTitle,
            companyName,
            location:
              $(element).find('.job-search-card__location').text().trim() ||
              'No Location',
            jobLink,
            postedDate,
            activelyHiring:
              $(element)
                .find('.job-posting-benefits__text')
                .text()
                .includes('Actively Hiring') || false,
          });
        } else {
          console.log(`\x1b[90mJOB: [${companyName}, ${jobTitle}, ${followersCount}]\x1b[0m`);
        }
      }
    }
  }
  return jobList;
};

const scrapeJobsForKeyword = async (keyword, start = 0, attempt = 0) => {
  let hasMoreResults = true;
  const jobs = [];
  const removeQueryParams = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch (e) {
      console.error('Invalid URL:', url);
      return url;
    }
  };

  while (hasMoreResults) {
    await randomDelay(3000, 7000);
    console.log(`\x1b[93m[ ============ Scraping LinkedIn for ${keyword.padEnd(25)} at ${start.toString().padStart(5)} ============ ]\x1b[0m`);
    const userAgent = randomUseragent.getRandom();
    const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&start=${start}&f_TPR=r1209600`;
    const options = {
      method: 'GET',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'User-Agent': userAgent,
        'cache-control': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="114", "Google Chrome";v="114", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'Referer': 'https://www.linkedin.com/jobs/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    };
    try {
      const response = await fetchQueue.add(() => {
        return (async () => {
          await asyncRandomDelay(0, 30000);
          return fetch(apiUrl, options);
        })();
      },
        { priority: start }
      );

      if (response.status === 429) {
        console.log(`\x1b[41m\x1b[30mRate limited on Attempt ${attempt} for Role: ${keyword}. Retrying after delay...\x1b[0m`);
        await exponentialBackoffDelay(attempt);
        return scrapeJobsForKeyword(keyword, start, attempt + 1);
      }
      if (response.status === 400 || response.status === 404) {
        console.log(`\x1b[92m[ ================ Completed LinkedIn for ${keyword.padEnd(24)} ================ ]\x1b[0m`);
        hasMoreResults = false;
        break;
      }
      if (!response.ok) {
        console.log(`\x1b[41m\x1b[30mRate limited on Attempt ${attempt} for Role: ${keyword}. Retrying after delay...\x1b[0m`);
        await exponentialBackoffDelay(attempt);
        return scrapeJobsForKeyword(keyword, start, attempt + 1);
      };
      attempt = 0;
      const html = await response.text();
      const jobListings = await extractJobDetails(html);
      console.log(`\x1b[35mWe have ${jobListings.length} verified jobs!\x1b[0m`);
      if (Array.isArray(jobListings)) {
        for (const job of jobListings) {
          if (job.companyName && job.jobTitle && job.jobLink) {
            job.jobLink = removeQueryParams(job.jobLink);
            await saveJob(job);
            jobs.push(job);
          }
        }
      }
      start += 10;
    } catch (error) {
      console.error('Error fetching data:', error);
      hasMoreResults = false;
    }
  }
  return jobs;
};


export const LinkedinScraper = async () => {
  let allJobs = [];
  const jobRoles = [
    'software intern',
    'software engineer intern',
    'software developer intern',
    'backend intern',
    'full stack intern',
    'computer science intern',
  ];

  try {
    const jobResults = await Promise.all(
      jobRoles.map(async (role) => {
        await asyncRandomDelay(5000, 7000);
        return await scrapeJobsForKeyword(role);
      })
    );
    allJobs.push(...jobResults.flat());
  } catch (error) {
    console.error('Error scraping jobs:', error);
  }
  return allJobs;
};

let currentStatus = 'error';
let lastScrapeTime = 0;
const ONE_HOUR = 60 * 60 * 1000;

const cacheScrapeTime = () => {
  lastScrapeTime = Date.now();
};

const shouldRefetch = () => {
  const currentTime = Date.now();
  return currentTime - lastScrapeTime > ONE_HOUR;
};

export const getLinkedinScraperStatus = async () => {
  if (currentStatus === 'success' && !shouldRefetch()) {
    return 'success';
  }
  try {
    const response = await fetch(
      'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=software%20intern&start=1',
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch the page. Status code: ${response.status}`,
      );
    }

    const html = await response.text();
    if (html.includes('job-search-card')) {
      currentStatus = 'success';
      cacheScrapeTime();
      return 'success';
    } else {
      currentStatus = 'error';
      return 'error';
    }
  } catch (error) {
    console.error('Error during scraper status check:', error.message);
    currentStatus = 'error';
    return 'error';
  }
};
