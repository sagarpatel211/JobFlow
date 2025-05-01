import { useCallback, useRef } from "react";
import { addJob, updateJob } from "../services/api";
import { format } from "date-fns";
import { Job, JobStatus } from "@/types/job";
import { statusKeys } from "@/lib/constants";
import { TrackerData } from "@/types/tracker";

interface UseJobManagerParams {
  trackerJobs: Job[];
  updateLocalJob: (id: number, updatedFields: Partial<Job>) => void;
  setTrackerJobs: (jobs: Job[]) => void;
  setTrackerData?: React.Dispatch<React.SetStateAction<TrackerData>>;
}

export function useJobManager({ trackerJobs, updateLocalJob, setTrackerJobs, setTrackerData }: UseJobManagerParams) {
  // Store original job data before modifications
  const originalJobsRef = useRef<Map<number, Job>>(new Map());

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
      status: "nothing_done",
      priority: false,
      isModifying: true,
      archived: false,
      deleted: false,
      atsScore: 0,
      tags: [],
      notes: "",
      followerCount: 0,
    };
  }, []);

  const handleAddNewJob = useCallback((): void => {
    const newJob = createNewJob();
    if (setTrackerData) {
      setTrackerData((prev) => {
        const newStatusCounts = { ...prev.statusCounts };
        const statusKey = statusKeys[newJob.statusIndex];
        newStatusCounts[statusKey] = (newStatusCounts[statusKey] ?? 0) + 1;
        return {
          ...prev,
          jobs: [newJob, ...prev.jobs],
          statusCounts: newStatusCounts,
        };
      });
    } else {
      setTrackerJobs([newJob, ...trackerJobs]);
    }
  }, [createNewJob, trackerJobs, setTrackerJobs, setTrackerData]);

  // Store original job when starting to modify
  const storeOriginalJob = useCallback(
    (jobId: number) => {
      const job = trackerJobs.find((j) => j.id === jobId);
      if (job) {
        originalJobsRef.current.set(jobId, { ...job });
      }
    },
    [trackerJobs],
  );

  const handleCancelModifyJob = useCallback(
    (job: Job) => {
      if (job.id < 0) {
        // new, un-saved job: decrement status count and remove job
        if (setTrackerData) {
          setTrackerData((prev) => {
            const newStatusCounts = { ...prev.statusCounts };
            const statusKey = statusKeys[job.statusIndex];
            if (newStatusCounts[statusKey] && newStatusCounts[statusKey] > 0) {
              newStatusCounts[statusKey] -= 1;
            }
            return {
              ...prev,
              jobs: prev.jobs.filter((j) => j.id !== job.id),
              statusCounts: newStatusCounts,
            };
          });
        } else {
          setTrackerJobs(trackerJobs.filter((j) => j.id !== job.id));
        }
      } else {
        // existing job: restore original values
        const originalJob = originalJobsRef.current.get(job.id);
        if (originalJob) {
          updateLocalJob(job.id, {
            ...originalJob,
            isModifying: false,
          });
          originalJobsRef.current.delete(job.id);
        } else {
          updateLocalJob(job.id, { isModifying: false });
        }
      }
    },
    [trackerJobs, updateLocalJob, setTrackerJobs, setTrackerData],
  );

  const handleSaveJob = useCallback(
    async (id: number): Promise<void> => {
      const job = trackerJobs.find((j) => j.id === id);
      if (!job) return;
      const clone = { ...job };
      const { isModifying, ...payload } = clone;

      // Ensure status is in sync with statusIndex
      const statusMapping: Record<number, JobStatus> = {
        0: "nothing_done",
        1: "applying",
        2: "applied",
        3: "oa",
        4: "interview",
        5: "offer",
        6: "rejected",
      };

      // Update status based on current statusIndex before sending to API
      payload.status = statusMapping[payload.statusIndex];
      // Optimistically apply all updated fields locally, including company, title, link, etc., and clear modifying state
      updateLocalJob(id, { ...payload, isModifying: false });

      // Clear the original stored job since we're saving changes
      originalJobsRef.current.delete(id);

      if (id < 0) {
        const result = await addJob({ ...payload, isModifying: false });
        // Remove the temp job and add server job with updated status counts
        const newJob = {
          ...payload,
          id: Number(result.job.id),
          isModifying: false,
          statusIndex: payload.statusIndex,
          status: payload.status,
          followerCount: 0,
        };

        // Update the tracker data and status counts
        if (setTrackerData) {
          setTrackerData((prev) => {
            const newJobs = [newJob, ...prev.jobs.filter((j) => j.id !== id)];

            // Don't update status counts here - they were already updated when the job was created
            // We're just replacing the temporary job with the server-saved one
            return {
              ...prev,
              jobs: newJobs,
            };
          });
        } else {
          // Fallback to setTrackerJobs if setTrackerData is not provided
          setTrackerJobs([newJob, ...trackerJobs.filter((j) => j.id !== id)]);
        }
      } else {
        await updateJob(id, payload);
      }
    },
    [trackerJobs, updateLocalJob, setTrackerData, setTrackerJobs],
  );

  return {
    handleAddNewJob,
    handleCancelModifyJob,
    handleSaveJob,
    storeOriginalJob,
  };
}
