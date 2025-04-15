import { useCallback } from "react";
import { updateJobStatusArrow } from "../services/api";
import { Job } from "@/types/job";
import { statuses } from "@/lib/constants";

export function useUpdateJobStatus(
  jobs: Job[],
  onUpdateJob: (id: number, data: Partial<Job>) => void,
  onUpdateJobStatusArrow?: (jobId: number, direction: number) => void,
): (jobId: number, direction: number) => void {
  const updateStatus = useCallback(
    (jobId: number, direction: number): void => {
      if (onUpdateJobStatusArrow) {
        onUpdateJobStatusArrow(jobId, direction);
        return;
      }
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      const oldStatusIndex = job.statusIndex;
      let newIndex = oldStatusIndex + direction;
      newIndex = Math.max(0, Math.min(statuses.length - 1, newIndex));
      onUpdateJob(jobId, { statusIndex: newIndex });
      updateJobStatusArrow(jobId, direction).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating job status:", errorMessage);
        onUpdateJob(jobId, { statusIndex: oldStatusIndex });
      });
    },
    [jobs, onUpdateJob, onUpdateJobStatusArrow],
  );

  return updateStatus;
}
