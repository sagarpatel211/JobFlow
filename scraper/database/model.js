import { DataTypes } from 'sequelize';
import { allDataDB, unreadDataDB, organizationDB } from './config.js';

const commonAttributes = {
  companyName: { type: DataTypes.STRING, allowNull: false },
  jobTitle: { type: DataTypes.STRING(512), allowNull: false },
  jobLink: { type: DataTypes.STRING(2048), allowNull: false },
  time: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
};

const Job = allDataDB.define('Job', commonAttributes, { tableName: 'Jobs' });
const UnreadJob = unreadDataDB.define('UnreadJob', commonAttributes, {
  tableName: 'UnreadJobs',
});

const OrganizationStatus = organizationDB.define(
  'OrganizationStatus',
  {
    organizationName: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unknown',
    },
    lastScrapeTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: 'OrganizationStatus' },
);

export { Job, UnreadJob, OrganizationStatus };
