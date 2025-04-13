import express from 'express';
import cron from 'node-cron';
import { runAllScrapers, checkAllScrapers } from './scrapers/index.js';
import { Job, UnreadJob } from './database/model.js';
import { syncDatabases } from './database/config.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const scraperRouter = express.Router();
let statusRequestInProgress = null;
const logFilePath = path.join('app.log');

const templistPath = path.join('templist.txt');
const blacklistPath = path.join('blacklist.txt');
const whitelistPath = path.join('whitelist.txt');

if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '');
}

function readFileAsArray(filePath) {
  return fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
}

function writeArrayToFile(filePath, array) {
  fs.writeFileSync(filePath, array.join('\n'));
}

const logFile = fs.createWriteStream(logFilePath, { flags: 'a' });
const originalLog = console.log;
console.log = function (...args) {
  const output = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    } else {
      return String(arg);
    }
  }).join(' ') + '\n';
  originalLog.apply(console, args);
  logFile.write(output);
};

async function getLastLines(filePath, lineCount = 100) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const lines = [];
  for await (const line of rl) {
    lines.push(line);
    if (lines.length > lineCount) {
      lines.shift();
    }
  }
  return lines.join('\n');
}

scraperRouter.get('/logs', async (req, res) => {
  try {
    const logs = await getLastLines(logFilePath, 200);
    res.status(200).send(`<pre>${logs}</pre>`);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

scraperRouter.get('/modifylist', (req, res) => {
  try {
    const links = readFileAsArray(templistPath);
    res.status(200).json(links);
  } catch (error) {
    console.error('Error reading templist:', error);
    res.status(500).json({ error: 'Failed to fetch the list' });
  }
});

scraperRouter.post('/modifylist', (req, res) => {
  const { link, action } = req.body;
  if (!link || !action) {
    return res.status(400).json({ error: 'Link and action are required' });
  }
  const validActions = ['blacklist', 'whitelist'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Action must be one of ${validActions.join(', ')}` });
  }
  try {
    let tempList = readFileAsArray(templistPath);
    if (!tempList.includes(link)) {
      return res.status(404).json({ error: 'Link not found in templist' });
    }
    const targetPath = action === 'blacklist' ? blacklistPath : whitelistPath;
    let targetList = readFileAsArray(targetPath);
    if (!targetList.includes(link)) {
      targetList.push(link);
      writeArrayToFile(targetPath, targetList);
    }
    tempList = tempList.filter(item => item !== link);
    writeArrayToFile(templistPath, tempList);
    res.status(200).json({ message: `Link added to ${action} and removed from templist` });
  } catch (error) {
    console.error('Error modifying list:', error);
    res.status(500).json({ error: 'Failed to modify the list' });
  }
});


async function waitForSeconds(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function startProcess() {
  console.log('Waiting for 1 second before starting...');
  await waitForSeconds(1);
  console.log('Calling syncDatabases...');
  await syncDatabases();
}

startProcess();

scraperRouter.get('/scrape', async (req, res) => {
  const fetchAll = req.query.all || false;
  try {
    const jobs = fetchAll ? await Job.findAll() : await UnreadJob.findAll();
    await UnreadJob.destroy({ where: {} });
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

scraperRouter.get('/status', async (req, res) => {
  try {
    if (!statusRequestInProgress) {
      console.log('\x1b[35mChecking scrapers status...\x1b[0m');
      statusRequestInProgress = checkAllScrapers();
      const scrapersStatus = await statusRequestInProgress;
      res.status(200).json(scrapersStatus);
      statusRequestInProgress = null;
    } else {
      console.log('Waiting for ongoing status check to complete...');
      const scrapersStatus = await statusRequestInProgress;
      res.status(200).json(scrapersStatus);
    }
  } catch (error) {
    console.error('Error checking scrapers:', error);
    statusRequestInProgress = null;
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

scraperRouter.get('/destroy', async (req, res) => {
  try {
    await Job.destroy({ where: {}, truncate: true });
    await UnreadJob.destroy({ where: {}, truncate: true });
    res
      .status(200)
      .json({ message: 'All data cleared from Jobs and UnreadJobs tables' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

let isScraping = false;

scraperRouter.get('/scrapenow', async (req, res) => {
  if (isScraping) {
    console.log('\x1b[31mScraper is already running!\x1b[0m');
    return res.status(400).json({ success: false, message: 'Scraper is already running' });
  }
  try {
    console.log('Starting scraper job...');
    setImmediate(async () => {
      try {
        isScraping = true;
        await runAllScrapers(true);
        // const data = await runAllScrapers(true)) || [];
        // const validData = data.filter(
        //   item => item && item.companyName && item.jobTitle && item.jobLink,
        // );
        // if (validData.length !== data.length) {
        //   console.warn('Some entries were skipped due to missing required fields:', data);
        // }
        // if (validData.length > 0) {
        //   await Job.bulkCreate(validData, { ignoreDuplicates: true });
        //   await UnreadJob.bulkCreate(validData, { ignoreDuplicates: true });
        //   console.log('Valid data successfully inserted into the database.');
        // } else {
        //   console.log('No data to insert anymore.');
        // }
      } catch (scrapeError) {
        console.error('Error during scraper job:', scrapeError);
      }
      isScraping = false;
    });
    res.status(200).json({ success: true, message: 'Scraper job started successfully' });
  } catch (error) {
    console.error('Error initiating the scraper job:', error);
    res.status(500).json({ success: false, message: 'Failed to start the scraper job' });
  }
});

export default scraperRouter;
