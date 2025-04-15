import { useCallback } from "react";
import { addJob, updateJob } from "../services/api";
import { format } from "date-fns";
import { Job, JobStatus } from "@/types/job";

interface UseJobManagerParams {
  trackerJobs: Job[];
  updateLocalJob: (id: number, updatedFields: Partial<Job>) => void;
  setTrackerJobs: (jobs: Job[]) => void;
}

export function useJobManager({
  trackerJobs,
  updateLocalJob,
  setTrackerJobs,
}: UseJobManagerParams) {
  const createNewJob = useCallback((): Job => {
    const today = new Date();
    const formattedDate = format(today, "dd.MM.yyyy");
    return {
      id: -Date.now(),
      company: "",
      title: "",
      postedDate: formattedDate,
      link: "",
      statusIndex: 0,
      priority: false,
      isModifying: true,
      archived: false,
      deleted: false,
      atsScore: 0,
      tags: [],
      role_type: "newgrad",
      status: "nothing_done",
      followerCount: 0,
    };
  }, []);

  const handleAddNewJob = useCallback(
    (setJobs: (jobs: Job[]) => void) => {
      const newJob = createNewJob();
      setJobs([newJob, ...trackerJobs]);
    },
    [createNewJob, trackerJobs],
  );

  const handleCancelModifyJob = useCallback(
    (job: Job, setJobs: (jobs: Job[]) => void) => {
      if (job.id < 0) {
        setJobs(trackerJobs.filter((j) => j.id !== job.id));
      } else {
        updateLocalJob(job.id, { isModifying: false });
      }
    },
    [trackerJobs, updateLocalJob],
  );

  const handleSaveJob = useCallback(
    async (id: number): Promise<void> => {
      const job = trackerJobs.find((j) => j.id === id);
      if (!job) return;
      try {
        const jobClone: Job = JSON.parse(JSON.stringify(job));
        const { isModifying, ...jobData } = jobClone;
        updateLocalJob(job.id, { isModifying: false });
        if (job.id < 0) {
          const result = await addJob(jobClone);
          setTrackerJobs((prevJobs) => {
            const remainingJobs = prevJobs.filter((j) => j.id !== job.id);
            const newJob: Job = {
              ...jobData,
              id: result.job.id,
              isModifying: false,
              postedDate: jobData.postedDate,
              status: jobData.status || (result.job.status as JobStatus),
              statusIndex: jobData.statusIndex || result.job.statusIndex || 0,
              followerCount: result.job.followerCount ?? 0,
            };
            return [newJob, ...remainingJobs];
          });
        } else {
          await updateJob(job.id, jobData);
          // For updates, we simply trust our optimistic update.
        }
      } catch (error: unknown) {
        console.error("Error saving job:", error);
        updateLocalJob(job.id, { isModifying: true });
        throw error;
      }
    },
    [trackerJobs, updateLocalJob, setTrackerJobs],
  );

  return { createNewJob, handleAddNewJob, handleCancelModifyJob, handleSaveJob };
}
