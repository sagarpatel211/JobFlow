import { useCallback } from "react";
import { updateJobStatusArrow } from "../services/api";
import { Job } from "@/types/job";
import { statuses } from "@/lib/constants";

export function useUpdateJobStatus(
  jobs: Job[],
  onUpdateJob: (id: number, p: Partial<Job>) => void,
  external?: (id: number, d: number) => void,
) {
  return useCallback(
    async (id: number, d: number) => {
      if (external) {
        external(id, d);
        return;
      }
      const j = jobs.find((x) => x.id === id);
      if (!j) return;
      const prev = j.statusIndex;
      let idx = prev + d;
      idx = Math.max(0, Math.min(statuses.length - 1, idx));
      if (idx === prev) return;
      onUpdateJob(id, { statusIndex: idx });
      try {
        await updateJobStatusArrow(id, d);
      } catch {
        onUpdateJob(id, { statusIndex: prev });
      }
    },
    [jobs, onUpdateJob, external],
  );
}
