import { Job, UnreadJob } from '../../database/model.js';

export const saveJob = async job => {
  try {
    const existingJob = await Job.findOne({ where: { jobLink: job.jobLink } });
    if (!existingJob) {
      const jobToSave = {
        ...job,
        time:
          job.postedDate instanceof Date && !isNaN(job.postedDate)
            ? job.postedDate.toISOString()
            : new Date(),
      };
      await Job.create(jobToSave);
      await UnreadJob.create(jobToSave);
    }
  } catch (error) {
    console.error('Error saving job:', error);
  }
};
