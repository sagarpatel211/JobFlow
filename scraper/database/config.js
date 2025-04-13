import { Sequelize, QueryTypes, DataTypes } from 'sequelize';
import { Job, UnreadJob, OrganizationStatus } from './model.js';
import fs from 'fs';
import path from 'path';

const databaseDir = path.resolve('./scraper/database');
const databasePath = path.join(databaseDir, 'data.db');

if (!fs.existsSync(databaseDir)) {
  console.log('Database directory not found, creating it...');
  fs.mkdirSync(databaseDir, { recursive: true });
}

if (!fs.existsSync(databasePath)) {
  console.log(`Database file not found at ${databasePath}, creating it...`);
}

const databaseUrl = 'sqlite:./scraper/database/data.db';

const allDataDB = new Sequelize(databaseUrl, { logging: false });
const unreadDataDB = new Sequelize(databaseUrl, { logging: false });
const organizationDB = new Sequelize(databaseUrl, { logging: false });

const syncLock = {
  allDataDB: false,
  unreadDataDB: false,
  organizationDB: false,
};

async function syncDatabases() {
  try {
    await allDataDB.authenticate();
    await unreadDataDB.authenticate();
    await organizationDB.authenticate();

    console.log('Database connections have been established successfully.');

    if (!syncLock.allDataDB) {
      syncLock.allDataDB = true;
      await syncAndReset(allDataDB, 'Jobs', Job);
      syncLock.allDataDB = false;
    }

    if (!syncLock.unreadDataDB) {
      syncLock.unreadDataDB = true;
      await syncAndReset(unreadDataDB, 'UnreadJobs', UnreadJob);
      syncLock.unreadDataDB = false;
    }

    if (!syncLock.organizationDB) {
      syncLock.organizationDB = true;
      await syncAndReset(
        organizationDB,
        'OrganizationStatus',
        OrganizationStatus,
      );
      syncLock.organizationDB = false;
    }

    console.log('Tables have been synchronized.');
  } catch (error) {
    console.error('Unable to connect or synchronize DB/tables:', error);
  }
}

async function syncAndReset(db, tableName, model) {
  try {
    const tableExists = await db.getQueryInterface().tableExists(tableName);

    if (!tableExists) {
      await model.sync();
      console.log(`Table ${tableName} created successfully.`);
    }
  } catch (error) {
    console.error(`Error during synchronization of ${tableName}:`, error);
  }
}

export { allDataDB, unreadDataDB, organizationDB, syncDatabases };
