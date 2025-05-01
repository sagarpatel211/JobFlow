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
  unarchiveJob,
} from "../services/api";
import { defaultTrackerData } from "../services/constants";
import { TrackerFilters } from "@/types/trackerHooks";
import { TrackerData } from "@/types/tracker";
import { Job } from "@/types/job";
import { toast } from "react-hot-toast";
import { createUndoableToast } from "../components/undotoast";
import { statusKeys, StatusKey } from "@/lib/constants";

interface Params {
  initialPage: number;
  itemsPerPage: number;
}

// API job shape as returned from backend
interface ApiJob {
  id: number;
  company: string;
  title: string;
  link: string;
  posted_date: string;
  status: StatusKey;
  priority: boolean;
  archived: boolean;
  atsScore?: number;
  tags?: string[];
  notes?: string;
  follower_count?: number;
  company_image_url?: string | null;
  deleted?: boolean;
  resumeFilename?: string;
  resumeUrl?: string;
  coverLetterFilename?: string;
  coverLetterUrl?: string;
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
        if (filters.filterWithinWeek) {
          const posted = new Date(job.postedDate.split(".").reverse().join("-"));
          if (Date.now() - posted.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
        }
        const normalizedTags = job.tags?.map((t) => t.toLowerCase().replace(/\s+/g, "")) ?? [];
        if (filters.filterIntern && !normalizedTags.includes("internship")) return false;
        if (filters.filterNewgrad && !normalizedTags.includes("newgrad")) return false;
        if (filters.selectedTag && !job.tags?.includes(filters.selectedTag)) return false;
        if (filters.showPriorityOnly && !job.priority) return false;
        return true;
      }),
    [
      filters.showArchived,
      filters.filterWithinWeek,
      filters.filterIntern,
      filters.filterNewgrad,
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
      filter_not_applied: filters.filterNotApplied ? "1" : "0",
      filter_within_week: filters.filterWithinWeek ? "1" : "0",
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

      // Map raw backend jobs to our Job type
      const rawJobs = (data.trackerData?.jobs ?? []) as unknown as ApiJob[];
      const jobs: Job[] = rawJobs.map(
        ({
          id,
          company,
          title,
          link,
          posted_date,
          status: apiStatus,
          priority,
          archived,
          atsScore,
          tags,
          notes,
          follower_count,
          company_image_url,
          deleted,
          resumeFilename,
          resumeUrl,
          coverLetterFilename,
          coverLetterUrl,
        }) => ({
          id,
          company,
          title,
          link,
          postedDate: posted_date,
          status: apiStatus,
          statusIndex: statusKeys.indexOf(apiStatus) || 0,
          priority,
          archived,
          atsScore,
          tags,
          notes,
          followerCount: follower_count ?? 0,
          company_image_url: company_image_url ?? null,
          deleted: deleted ?? false,
          isModifying: false,
          resumeFilename,
          resumeUrl,
          coverLetterFilename,
          coverLetterUrl,
        }),
      );

      setTrackerData({
        ...(data.trackerData ?? defaultTrackerData),
        jobs: applyClientSideFilters(jobs),
        pagination: { ...(data.trackerData?.pagination ?? defaultTrackerData.pagination), currentPage },
        statusCounts: data.trackerData?.statusCounts ?? defaultTrackerData.statusCounts,
        scrapeInfo: data.trackerData?.scrapeInfo ?? defaultTrackerData.scrapeInfo,
        health: data.trackerData?.health ?? defaultTrackerData.health,
      });
      setError(null);
    } catch (_error: unknown) {
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

  // Toggle archived flag: archive or unarchive based on current state
  const handleArchiveToggle = useCallback(
    async (id: number) => {
      const job = trackerData.jobs.find((j) => j.id === id);
      if (!job) return;
      const prevArchived = job.archived;
      await optimistic(
        () => updateLocalJob(id, { archived: !prevArchived }),
        () => (prevArchived ? unarchiveJob(id) : archiveJob(id)),
        () => updateLocalJob(id, { archived: prevArchived }),
      );
    },
    [trackerData.jobs, updateLocalJob],
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
            permanentDeleteJob(id).catch((error: unknown) => {
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
            .catch((error: unknown) => {
              console.error("Failed to restore job:", error);
              toast.error("Failed to restore job");

              // Still remove from processing jobs if restore fails
              setTrackerData((p) => ({
                ...p,
                jobs: [...prev],
                statusCounts: prevStatusCounts,
              }));
              setProcessingJobs((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            });
        };

        // Show the undoable toast
        createUndoableToast(message, handleUndo);
      } catch (error: unknown) {
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
      idx = Math.max(0, Math.min(statusKeys.length - 1, idx));
      if (idx === prev) return;

      // For new unsaved jobs, just update local state without API or optimistic revert
      if (id < 0) {
        updateLocalJob(id, { statusIndex: idx });
        return;
      }

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

  // Archive or unarchive then reload all tracker data
  const handleArchiveWithRefresh = useCallback(
    async (id: number) => {
      await handleArchiveToggle(id);
      await loadTrackerData();
    },
    [handleArchiveToggle, loadTrackerData],
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
    handleArchiveToggle,
    handleTogglePriority,
    handleDeleteJob,
    handleUpdateJobStatus,
    goToNextPage,
    goToPrevPage,
    goToPage,
    setTrackerData,
    isJobProcessing,
    handleArchiveWithRefresh,
    loadTrackerData,
  };
}
