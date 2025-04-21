import { useCallback, useEffect, useState } from "react";
import React from "react";
import {
  fetchTrackerData,
  archiveJob,
  deleteJob,
  restoreJob,
  permanentDeleteJob,
  togglePriorityJob,
  updateJobStatusArrow,
  optimistic,
} from "../services/api";
import { defaultTrackerData } from "../services/constants";
import { TrackerFilters } from "@/types/trackerHooks";
import { TrackerData } from "@/types/tracker";
import { Job } from "@/types/job";
import { statuses, statusKeys } from "@/lib/constants";
import { toast } from "react-hot-toast";
import { createUndoableToast } from "../components/undotoast";

interface Params {
  initialPage: number;
  itemsPerPage: number;
}

// Define the raw API response type to handle the mismatch
interface ApiJob extends Omit<Job, "postedDate" | "statusIndex" | "isModifying"> {
  posted_date: string;
  status: string;
}

export function useTrackerData({ initialPage, itemsPerPage }: Params) {
  const [trackerData, setTrackerData] = useState<TrackerData>(defaultTrackerData);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingJobs, setProcessingJobs] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState<TrackerFilters>({
    sortBy: "date",
    sortDirection: "desc",
    searchTerm: "",
    showArchived: false,
    showPriorityOnly: false,
    onlyNotApplied: false,
    recentOnly: false,
    roleFilter: "",
    groupByCompany: false,
    selectedTag: null,
    filterNotApplied: false,
    filterWithinWeek: false,
    filterIntern: false,
    filterNewgrad: false,
  });

  const applyClientSideFilters = useCallback(
    (jobs: Job[]): Job[] =>
      jobs.filter((job) => {
        if (!filters.showArchived && job.archived) return false;
        if (filters.onlyNotApplied && job.statusIndex !== 0) return false;
        if (filters.recentOnly) {
          const posted = new Date(job.postedDate.split(".").reverse().join("-"));
          if (Date.now() - posted.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
        }
        if (filters.filterIntern && job.role_type !== "intern") return false;
        if (filters.filterNewgrad && job.role_type !== "newgrad") return false;
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          if (!job.company.toLowerCase().includes(term) && !job.title.toLowerCase().includes(term)) return false;
        }
        if (filters.selectedTag && !job.tags?.includes(filters.selectedTag)) return false;
        if (filters.showPriorityOnly && !job.priority) return false;
        return true;
      }),
    [
      filters.showArchived,
      filters.onlyNotApplied,
      filters.recentOnly,
      filters.filterIntern,
      filters.filterNewgrad,
      filters.searchTerm,
      filters.selectedTag,
      filters.showPriorityOnly,
    ],
  );

  const query = useCallback(() => {
    const p = new URLSearchParams({
      page: String(currentPage),
      per_page: String(itemsPerPage),
      sort_by: filters.sortBy,
      sort_direction: filters.sortDirection,
      show_archived: filters.showArchived ? "1" : "0",
      show_priority: filters.showPriorityOnly ? "1" : "0",
      filter_not_applied: filters.onlyNotApplied ? "1" : "0",
      filter_within_week: filters.recentOnly ? "1" : "0",
      filter_intern: filters.filterIntern ? "1" : "0",
      filter_newgrad: filters.filterNewgrad ? "1" : "0",
      group_by_company: filters.groupByCompany ? "1" : "0",
    });
    if (filters.selectedTag) p.append("selected_tag", filters.selectedTag);
    if (filters.searchTerm) p.append("search", filters.searchTerm);
    return p;
  }, [currentPage, itemsPerPage, filters]);

  const loadTrackerData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTrackerData(query());
      const td = data.trackerData || defaultTrackerData;

      const jobs = (td.jobs ?? []).map((j: ApiJob) => ({
        ...j,
        postedDate: j.posted_date,
        statusIndex: statusKeys.indexOf(j.status as (typeof statusKeys)[number]) || 0,
        isModifying: false,
      }));

      setTrackerData({
        ...td,
        jobs: applyClientSideFilters(jobs),
        pagination: { ...td.pagination, currentPage },
        statusCounts: td.statusCounts ?? defaultTrackerData.statusCounts,
        scrapeInfo: td.scrapeInfo ?? defaultTrackerData.scrapeInfo,
        health: td.health ?? defaultTrackerData.health,
      });
      setError(null);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [applyClientSideFilters, currentPage, query]);

  useEffect(() => {
    void loadTrackerData();
  }, [loadTrackerData]);

  const updateLocalJob = useCallback((id: number, fields: Partial<Job>) => {
    setTrackerData((prev) => {
      const newStatusCounts = { ...prev.statusCounts };
      const newJobs = prev.jobs.map((job) => {
        if (job.id !== id) return job;
        if (typeof fields.statusIndex === "number" && fields.statusIndex !== job.statusIndex) {
          const oldKey = statusKeys[job.statusIndex];
          const newKey = statusKeys[fields.statusIndex];
          newStatusCounts[oldKey] = (newStatusCounts[oldKey] ?? 0) - 1;
          newStatusCounts[newKey] = (newStatusCounts[newKey] ?? 0) + 1;
        }
        return { ...job, ...fields };
      });
      return { ...prev, jobs: newJobs, statusCounts: newStatusCounts };
    });
  }, []);

  const handleArchiveJob = useCallback(
    async (id: number) => {
      const prev = trackerData.jobs;
      await optimistic(
        () =>
          setTrackerData((p) => ({
            ...p,
            jobs: p.jobs.map((j) => (j.id === id ? { ...j, archived: true } : j)),
          })),
        () => archiveJob(id),
        () => setTrackerData((p) => ({ ...p, jobs: prev })),
      );
    },
    [trackerData.jobs],
  );

  const handleTogglePriority = useCallback(
    async (id: number) => {
      const job = trackerData.jobs.find((j) => j.id === id);
      if (!job) return;
      const prev = job.priority;
      await optimistic(
        () => updateLocalJob(id, { priority: !prev }),
        () => togglePriorityJob(id),
        () => updateLocalJob(id, { priority: prev }),
      );
    },
    [trackerData.jobs, updateLocalJob],
  );

  const handleDeleteJob = useCallback(
    async (id: number) => {
      const job = trackerData.jobs.find((j) => j.id === id);
      if (!job) return;

      // Mark this job as being processed
      setProcessingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });

      const prev = trackerData.jobs;
      const prevStatusCounts = { ...trackerData.statusCounts };

      try {
        // Soft delete on the server
        await deleteJob(id);

        // Update the UI to remove the job
        setTrackerData((p) => {
          // Get status key for the job being deleted
          const statusKey = statusKeys[job.statusIndex];

          // Update status counts by decrementing the count for this job's status
          const newStatusCounts = { ...p.statusCounts };
          if (newStatusCounts[statusKey] && newStatusCounts[statusKey] > 0) {
            newStatusCounts[statusKey] -= 1;
          }

          return {
            ...p,
            jobs: p.jobs.filter((j) => j.id !== id),
            statusCounts: newStatusCounts,
          };
        });

        // Create a reference to track if undo was clicked
        let undoClicked = false;

        // Set up permanent deletion timeout
        const deletionTimeout = setTimeout(() => {
          if (!undoClicked) {
            permanentDeleteJob(id).catch((error) => {
              console.error("Error permanently deleting job:", error);
            });
          }

          // Remove this job from the processing set after permanent deletion timeout
          setProcessingJobs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }, 10000); // 10 seconds

        // Create a message with the job title
        const message = (
          <>
            Deleted job <b>{job.title}</b>
          </>
        );

        // Create an undo function
        const handleUndo = () => {
          undoClicked = true;
          clearTimeout(deletionTimeout);

          // Restore the job
          restoreJob(id)
            .then(() => {
              // Update UI to restore the job
              setTrackerData((p) => ({
                ...p,
                jobs: [...prev],
                statusCounts: prevStatusCounts,
              }));
              toast.success("Job restored successfully");

              // Remove from the processing jobs set when restored
              setProcessingJobs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            })
            .catch((error) => {
              console.error("Failed to restore job:", error);
              toast.error("Failed to restore job");

              // Still remove from processing jobs if restore fails
              setProcessingJobs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            });
        };

        // Show the undoable toast
        createUndoableToast(message, handleUndo);
      } catch (error) {
        console.error("Error in handleDeleteJob:", error);
        toast.error("An error occurred while deleting the job");

        // Remove from processing jobs on error
        setProcessingJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    },
    [trackerData.jobs, trackerData.statusCounts],
  );

  const handleUpdateJobStatus = useCallback(
    async (id: number, d: number) => {
      const j = trackerData.jobs.find((x) => x.id === id);
      if (!j) return;
      const prev = j.statusIndex;
      let idx = prev + d;
      idx = Math.max(0, Math.min(statuses.length - 1, idx));
      if (idx === prev) return;
      await optimistic(
        () => updateLocalJob(id, { statusIndex: idx }),
        () => updateJobStatusArrow(id, d),
        () => updateLocalJob(id, { statusIndex: prev }),
      );
    },
    [trackerData.jobs, updateLocalJob],
  );

  const updateFilters = useCallback((f: Partial<TrackerFilters>) => {
    setFilters((p) => ({ ...p, ...f }));
    setCurrentPage(1);
  }, []);

  const goToNextPage = () => {
    if (trackerData.pagination.currentPage < trackerData.pagination.totalPages) setCurrentPage((p) => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= trackerData.pagination.totalPages) setCurrentPage(p);
  };

  const isJobProcessing = useCallback(
    (id: number) => {
      return processingJobs.has(id);
    },
    [processingJobs],
  );

  return {
    trackerData,
    loading,
    isInitialLoading,
    error,
    currentPage,
    filters,
    updateFilters,
    updateLocalJob,
    handleArchiveJob,
    handleTogglePriority,
    handleDeleteJob,
    handleUpdateJobStatus,
    goToNextPage,
    goToPrevPage,
    goToPage,
    setTrackerData,
    isJobProcessing,
  };
}
