import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Job, JobStatus } from "@/types/job";
import { TrackerData } from "@/types/tracker";
import { UseTrackerDataProps, TrackerFilters } from "@/types/trackerHooks";
import { fetchTrackerData, archiveJob, deleteJob, togglePriorityJob, updateJobStatusArrow } from "../services/api";

// Default tracker data structure
const defaultTrackerData: TrackerData = {
  jobs: [],
  statusCounts: {
    nothing_done: 0,
    applying: 0,
    applied: 0,
    OA: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  },
  pagination: {
    totalJobs: 0,
    currentPage: 1,
    itemsPerPage: 4,
    totalPages: 1,
  },
  scrapeInfo: {
    scraping: false,
    scrapeProgress: 0,
    estimatedSeconds: 0,
  },
  health: { isHealthy: false },
};

export function useTrackerData({ initialPage, itemsPerPage }: UseTrackerDataProps) {
  const BASE_URL: string = process.env.NEXT_PUBLIC_API_URL ?? "";
  const [trackerData, setTrackerData] = useState<TrackerData>(defaultTrackerData);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
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
    selectedFolder: null,
  });

  // Apply client-side filters for folder and tag filtering
  const applyClientSideFilters = useCallback(
    (jobs: Job[]) => {
      return jobs.filter((job) => {
        // Tag filtering
        if (filters.selectedTag && (!job.tags || !job.tags.includes(filters.selectedTag))) {
          return false;
        }

        // Folder filtering
        if (filters.selectedFolder && (!job.folders || !job.folders.some((f) => f.id === filters.selectedFolder))) {
          return false;
        }

        return true;
      });
    },
    [filters.selectedTag, filters.selectedFolder],
  );

  // Build query parameters for API request
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: String(itemsPerPage),
      sort_by: filters.sortBy,
      sort_direction: filters.sortDirection,
      show_archived: filters.showArchived ? "1" : "0",
      show_priority: filters.showPriorityOnly ? "1" : "0",
      filter_not_applied: filters.onlyNotApplied ? "1" : "0",
      filter_within_week: filters.recentOnly ? "1" : "0",
      filter_role: filters.roleFilter,
      group_by_company: filters.groupByCompany ? "1" : "0",
    });
    return params;
  }, [currentPage, itemsPerPage, filters]);

  // Fetch tracker data
  const loadTrackerData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const data = await fetchTrackerData(params);

      // Add isModifying flag to each job for the UI state
      const jobsWithUIState = data.trackerData.jobs.map((job) => ({
        ...job,
        isModifying: false,
      }));

      // Apply client-side filters for folders and tags
      const filteredJobs = applyClientSideFilters(jobsWithUIState);

      setTrackerData({
        ...data.trackerData,
        jobs: filteredJobs,
        pagination: {
          ...data.trackerData.pagination,
          currentPage: currentPage,
        },
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Using cached or initial data.");
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [buildQueryParams, currentPage, applyClientSideFilters]);

  // Update a job in the local state
  const updateLocalJob = useCallback((id: number, updatedFields: Partial<Job>) => {
    setTrackerData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job)),
    }));
  }, []);

  // Handle job archiving
  const handleArchiveJob = useCallback(
    async (id: number): Promise<void> => {
      try {
        await archiveJob(id);
        toast.success("Job archived successfully!");

        // Refetch data to ensure we have 4 jobs on the page
        await loadTrackerData();
      } catch (error) {
        console.error("Error archiving job:", error);
        toast.error("Failed to archive job: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    },
    [loadTrackerData],
  );

  // Handle job priority toggle
  const handleTogglePriority = useCallback(
    async (id: number): Promise<void> => {
      try {
        // Find the job and toggle its priority locally before making API call
        const jobToUpdate = trackerData.jobs.find((job) => job.id === id);
        if (!jobToUpdate) {
          throw new Error("Job not found in local state");
        }

        // Update local state immediately with the toggled priority
        const newPriority = !jobToUpdate.priority;
        setTrackerData((prev) => ({
          ...prev,
          jobs: prev.jobs.map((job) => (job.id === id ? { ...job, priority: newPriority } : job)),
        }));

        // Toast for better user feedback
        toast.success(`Job ${newPriority ? "marked as priority" : "unmarked as priority"}`);

        // Make API call
        const result = await togglePriorityJob(id);

        // Verify the server's response matches our local state update
        if (result.priority !== newPriority) {
          // If there's a mismatch, update local state to match server
          setTrackerData((prev) => ({
            ...prev,
            jobs: prev.jobs.map((job) => (job.id === id ? { ...job, priority: result.priority } : job)),
          }));
        }
      } catch (error) {
        console.error("Error toggling priority:", error);
        toast.error("Failed to update priority: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    },
    [trackerData.jobs],
  );

  // Handle job deletion
  const handleDeleteJob = useCallback(
    async (id: number): Promise<void> => {
      try {
        // Find the job to delete to update status counts
        const jobToDelete = trackerData.jobs.find((job) => job.id === id);
        if (jobToDelete && jobToDelete.status) {
          // Update status counts immediately for smoother UX
          setTrackerData((prev) => ({
            ...prev,
            statusCounts: {
              ...prev.statusCounts,
              [jobToDelete.status as keyof typeof prev.statusCounts]: Math.max(
                0,
                (prev.statusCounts[jobToDelete.status as keyof typeof prev.statusCounts] || 0) - 1,
              ),
            },
          }));
        }

        await deleteJob(id);
        toast.success("Job deleted successfully!");

        // Refetch data to ensure we have 4 jobs on the page
        await loadTrackerData();
      } catch (error) {
        console.error("Error deleting job:", error);
        toast.error("Failed to delete job: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    },
    [loadTrackerData, trackerData.jobs],
  );

  // Handle updating job status with arrows
  const handleUpdateJobStatus = useCallback(
    async (jobId: number, direction: number): Promise<void> => {
      try {
        // Find the job to update
        const jobToUpdate = trackerData.jobs.find((job) => job.id === jobId);
        if (!jobToUpdate) {
          throw new Error("Job not found in local state");
        }

        // Calculate new status index
        const statuses: JobStatus[] = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
        const currentIndex = statuses.indexOf(jobToUpdate.status ?? "nothing_done");
        let newIndex = currentIndex + direction;
        newIndex = Math.max(0, Math.min(statuses.length - 1, newIndex));

        if (currentIndex === newIndex) {
          // No change needed
          return;
        }

        const newStatus = statuses[newIndex];

        // Update local state immediately
        setTrackerData((prev) => ({
          ...prev,
          jobs: prev.jobs.map((job) => (job.id === jobId ? { ...job, status: newStatus, statusIndex: newIndex } : job)),
          statusCounts: {
            ...prev.statusCounts,
            [jobToUpdate.status as keyof typeof prev.statusCounts]: Math.max(
              0,
              prev.statusCounts[jobToUpdate.status as keyof typeof prev.statusCounts] - 1,
            ),
            [newStatus as keyof typeof prev.statusCounts]:
              (prev.statusCounts[newStatus as keyof typeof prev.statusCounts] || 0) + 1,
          },
        }));

        // Remove toast notification for status updates
        // toast.success(`Job status updated to ${newStatus}`);

        // Make API call
        await updateJobStatusArrow(jobId, direction);

        // No need to update state again as we already did it optimistically
      } catch (error) {
        console.error("Error updating job status:", error);
        toast.error("Failed to update job status: " + (error instanceof Error ? error.message : "Unknown error"));

        // In case of error, we should reload data to get the correct state
        await loadTrackerData();
      }
    },
    [trackerData.jobs, loadTrackerData],
  );

  // Pagination controls
  const goToNextPage = useCallback((): void => {
    if (currentPage < trackerData.pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, trackerData.pagination.totalPages]);

  const goToPrevPage = useCallback((): void => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (page: number): void => {
      if (page >= 1 && page <= trackerData.pagination.totalPages) {
        setCurrentPage(page);
      }
    },
    [trackerData.pagination.totalPages],
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TrackerFilters>) => {
    setFilters((prev) => {
      // Special case: If groupByCompany is being enabled, we need to force sort by company
      if (newFilters.groupByCompany === true) {
        newFilters.sortBy = "company";
        // Default to ascending sort (A-Z) for better readability
        newFilters.sortDirection = "asc";
      }

      return {
        ...prev,
        ...newFilters,
      };
    });

    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, []);

  // Effect to load data when dependencies change
  useEffect(() => {
    void loadTrackerData();
  }, [loadTrackerData]);

  return {
    trackerData,
    setTrackerData,
    loading,
    isInitialLoading,
    error,
    currentPage,
    filters,
    updateFilters,
    goToNextPage,
    goToPrevPage,
    goToPage,
    updateLocalJob,
    handleArchiveJob,
    handleTogglePriority,
    handleDeleteJob,
    handleUpdateJobStatus,
    refreshData: loadTrackerData,
  };
}
