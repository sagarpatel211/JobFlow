import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Job, JobStatus } from "@/types/job";
import { UseJobManagerProps, FieldValueType } from "@/types/trackerHooks";
import { addJob, updateJob } from "../services/api";

export function useJobManager({ updateLocalJob, refreshData, trackerData, setTrackerData }: UseJobManagerProps) {
  // Create a new job template
  const createNewJob = useCallback((): Job => {
    const today = new Date();
    const formattedDate = format(today, "dd.MM.yyyy");

    return {
      id: -Date.now(), // Use negative ID to indicate a new job
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
    };
  }, []);

  // Add a new job to the UI
  const handleAddNewJob = useCallback(
    (jobs: Job[], setJobs: (jobs: Job[]) => void): void => {
      const newJob = createNewJob();

      // Just add the new job at the beginning without removing any existing jobs
      setJobs([newJob, ...jobs]);
    },
    [createNewJob],
  );

  // Start modifying a job
  const handleModifyJob = useCallback(
    (id: number): void => {
      updateLocalJob(id, { isModifying: true });
    },
    [updateLocalJob],
  );

  // Handle field updates during editing
  const handleUpdateJobField = useCallback(
    (id: number, field: string, value: FieldValueType): void => {
      // Special handling for statusIndex field to ensure status is also updated
      if (field === "statusIndex" && typeof value === "number") {
        const statuses: JobStatus[] = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
        const statusValue = statuses[value] || "nothing_done";
        updateLocalJob(id, {
          statusIndex: value,
          status: statusValue,
        });
      }
      // Special handling for postedDate to ensure it's saved correctly
      else if (field === "postedDate" && typeof value === "string") {
        // Store the date verbatim - don't try to parse or format it here
        updateLocalJob(id, {
          postedDate: value,
        });
      } else if (field === "status" && typeof value === "string") {
        // Special handling for direct status changes
        const statuses: JobStatus[] = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
        const statusIndex = statuses.indexOf(value as JobStatus);
        updateLocalJob(id, {
          status: value as JobStatus,
          statusIndex: statusIndex >= 0 ? statusIndex : 0,
        });
      } else {
        // For other fields, just update the field directly
        // Cast safely based on field type
        if (field === "company" || field === "title" || field === "link" || field === "role_type") {
          updateLocalJob(id, { [field]: value as string });
        } else if (field === "priority" || field === "archived" || field === "deleted") {
          updateLocalJob(id, { [field]: value as boolean });
        } else if (field === "atsScore") {
          updateLocalJob(id, { [field]: value as number });
        } else if (field === "tags") {
          updateLocalJob(id, { [field]: value as string[] });
        } else {
          // Type the field safely
          updateLocalJob(id, { [field]: value });
        }
      }
    },
    [updateLocalJob],
  );

  // Save a job to the server
  const handleSaveJob = useCallback(
    async (job: Job): Promise<void> => {
      try {
        // Create a deep copy of the job to avoid any reference issues
        const jobToSave = JSON.parse(JSON.stringify(job)) as Job;
        const { isModifying, ...jobData } = jobToSave;

        // Store the original postedDate for preservation
        const originalPostedDate = jobData.postedDate;

        // Set job as not modifying immediately in the UI
        updateLocalJob(job.id, { isModifying: false });

        // Make sure status is properly set based on statusIndex
        if (jobData.statusIndex !== undefined) {
          const statuses: JobStatus[] = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
          jobData.status = statuses[jobData.statusIndex];
        }

        // Ensure the postedDate is present in the API request
        if (!jobData.postedDate) {
          // If somehow postedDate is missing, use today's date as fallback
          const today = new Date();
          jobData.postedDate = format(today, "dd.MM.yyyy");
        }

        if (job.id < 0) {
          // For new jobs, update status counts immediately
          const status = jobData.status || "nothing_done";
          setTrackerData((prev) => {
            return {
              ...prev,
              statusCounts: {
                ...prev.statusCounts,
                [status]: (prev.statusCounts[status] || 0) + 1,
              },
            };
          });

          // Add a new job and get the response
          const result = await addJob(jobToSave);

          // Update the job in the UI with the server-assigned ID
          setTrackerData((prev) => {
            // Find and remove the temporary job with negative ID
            const filteredJobs = prev.jobs.filter((j) => j.id !== job.id);

            // Add the new job with data from our form,
            // but use the server's ID and other server-assigned fields
            const newServerJob: Job = {
              ...result.job,
              id: result.job.id,
              isModifying: false,
              // Explicitly preserve our postedDate
              postedDate: originalPostedDate || result.job.postedDate,
              // Keep status and statusIndex synchronized
              status: jobData.status || result.job.status,
              statusIndex: jobData.statusIndex || result.job.statusIndex,
            };

            return {
              ...prev,
              jobs: [newServerJob, ...filteredJobs],
            };
          });
        } else {
          // For existing jobs, determine if status changed
          const existingJob = trackerData.jobs.find((j) => j.id === job.id);
          if (existingJob && existingJob.status && jobData.status && existingJob.status !== jobData.status) {
            // Status has changed, update counts in client state
            const oldStatus = existingJob.status;
            const newStatus = jobData.status;

            setTrackerData((prev) => {
              const prevCounts = { ...prev.statusCounts };
              if (prevCounts[oldStatus] !== undefined) {
                prevCounts[oldStatus] = Math.max(0, prevCounts[oldStatus] - 1);
              }
              if (prevCounts[newStatus] !== undefined) {
                prevCounts[newStatus] = prevCounts[newStatus] + 1;
              }

              return {
                ...prev,
                statusCounts: prevCounts,
              };
            });
          }

          // Update an existing job
          await updateJob(job.id, jobData);

          // Update the UI with the local data but preserve the posted date explicitly
          setTrackerData((prev) => {
            const updatedJobs = prev.jobs.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    ...jobData,
                    isModifying: false,
                    // Always use our original posted date, not whatever the server returns
                    postedDate: originalPostedDate,
                  }
                : j,
            );

            return {
              ...prev,
              jobs: updatedJobs,
            };
          });
        }

        toast.success(`Job ${job.id < 0 ? "created" : "updated"} successfully!`);
      } catch (error) {
        console.error("Error saving job:", error);
        toast.error(`Failed to save job: ${error instanceof Error ? error.message : "Unknown error"}`);

        // If there was an error, we'll set the job back to editing mode
        // but only if it still exists in our state
        setTrackerData((prev) => {
          const jobExists = prev.jobs.some((j) => j.id === job.id);
          if (jobExists) {
            return {
              ...prev,
              jobs: prev.jobs.map((j) => (j.id === job.id ? { ...j, isModifying: true } : j)),
            };
          }
          return prev;
        });
      }
    },
    [trackerData.jobs, updateLocalJob, setTrackerData],
  );

  // Cancel job editing
  const handleCancelModifyJob = useCallback(
    (job: Job, jobs: Job[], setJobs: (jobs: Job[]) => void): void => {
      if (job.id < 0) {
        // For new jobs, remove only the temporary job with negative ID
        setJobs(jobs.filter((j) => j.id !== job.id));
      } else {
        // For existing jobs, just set isModifying to false
        updateLocalJob(job.id, { isModifying: false });
      }
    },
    [updateLocalJob],
  );

  return {
    createNewJob,
    handleAddNewJob,
    handleModifyJob,
    handleUpdateJobField,
    handleSaveJob,
    handleCancelModifyJob,
  };
}
