import { useCallback, useEffect, useState } from "react";
import { fetchTrackerData, archiveJob, deleteJob, togglePriorityJob, updateJobStatusArrow } from "../services/api";
import { defaultTrackerData } from "../services/constants";
import { TrackerFilters } from "@/types/trackerHooks";
import { TrackerData } from "@/types/tracker";
import { Job } from "@/types/job";

interface UseTrackerDataParams {
  initialPage: number;
  itemsPerPage: number;
}

export function useTrackerData({ initialPage, itemsPerPage }: UseTrackerDataParams) {
  const [trackerData, setTrackerData] = useState<TrackerData>(defaultTrackerData);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    (jobs: Job[]): Job[] => {
      return jobs.filter((job) => {
        if (filters.selectedTag && (!job.tags || !job.tags.includes(filters.selectedTag))) {
          return false;
        }
        return true;
      });
    },
    [filters.selectedTag],
  );

  const buildQueryParams = useCallback((): URLSearchParams => {
    const params = new URLSearchParams({
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
    if (filters.selectedTag) {
      params.append("selected_tag", filters.selectedTag);
    }
    if (filters.searchTerm) {
      params.append("search", filters.searchTerm);
    }
    return params;
  }, [currentPage, itemsPerPage, filters]);

  const loadTrackerData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const data = await fetchTrackerData(params);
      if (data.trackerData) {
        const rawJobs = Array.isArray(data.trackerData.jobs) ? data.trackerData.jobs : [];
        const jobsWithUIState = rawJobs.map((job) => ({
          ...job,
          isModifying: false,
        }));
        const filteredJobs = applyClientSideFilters(jobsWithUIState);
        setTrackerData({
          ...data.trackerData,
          jobs: filteredJobs,
          pagination: {
            ...data.trackerData.pagination,
            currentPage: currentPage,
          },
          statusCounts: data.trackerData.statusCounts || defaultTrackerData.statusCounts,
          scrapeInfo: data.trackerData.scrapeInfo || defaultTrackerData.scrapeInfo,
          health: data.trackerData.health || defaultTrackerData.health,
        });
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [buildQueryParams, currentPage, applyClientSideFilters]);

  useEffect(() => {
    void loadTrackerData();
  }, [loadTrackerData]);

  const updateLocalJob = useCallback((id: number, updatedFields: Partial<Job>): void => {
    setTrackerData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job)),
    }));
  }, []);

  const handleArchiveJob = useCallback(
    async (id: number): Promise<void> => {
      try {
        await archiveJob(id);
        await loadTrackerData();
      } catch (error) {
        console.error("Error archiving job:", error);
      }
    },
    [loadTrackerData],
  );

  const handleTogglePriority = useCallback(
    async (id: number): Promise<void> => {
      try {
        const job = trackerData.jobs.find((job) => job.id === id);
        if (!job) throw new Error("Job not found");
        const newPriority = !job.priority;
        updateLocalJob(id, { priority: newPriority });
        const result = await togglePriorityJob(id);
        if (result.priority !== newPriority) {
          updateLocalJob(id, { priority: result.priority });
        }
      } catch (error) {
        console.error("Error toggling priority:", error);
      }
    },
    [trackerData.jobs, updateLocalJob],
  );

  const handleDeleteJob = useCallback(
    async (id: number): Promise<void> => {
      try {
        await deleteJob(id);
        setTrackerData((prev) => ({
          ...prev,
          jobs: prev.jobs.filter((job) => job.id !== id),
        }));
        if (trackerData.jobs.length === 1 && currentPage > 1) {
          setCurrentPage((prevPage) => prevPage - 1);
        } else {
          await loadTrackerData();
        }
      } catch (error) {
        console.error("Error deleting job:", error);
      }
    },
    [loadTrackerData, trackerData.jobs, currentPage],
  );

  const handleUpdateJobStatus = useCallback(
    async (id: number, direction: number): Promise<void> => {
      try {
        const job = trackerData.jobs.find((job) => job.id === id);
        if (!job) throw new Error("Job not found");
        const oldStatusIndex = job.statusIndex;
        let newStatusIndex = oldStatusIndex + direction;
        newStatusIndex = Math.max(0, Math.min(6, newStatusIndex));
        if (newStatusIndex === oldStatusIndex) return;
        updateLocalJob(id, { statusIndex: newStatusIndex });
        await updateJobStatusArrow(id, direction);
      } catch (error) {
        console.error("Error updating job status:", error);
      }
    },
    [trackerData.jobs, updateLocalJob],
  );

  const updateFilters = useCallback((newFilters: Partial<TrackerFilters>): void => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setCurrentPage(1);
  }, []);

  const goToNextPage = useCallback((): void => {
    if (trackerData.pagination.currentPage < trackerData.pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [trackerData.pagination]);

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

  return {
    trackerData,
    loading,
    isInitialLoading,
    error,
    currentPage,
    filters,
    updateFilters,
    loadTrackerData,
    updateLocalJob,
    handleArchiveJob,
    handleTogglePriority,
    handleDeleteJob,
    handleUpdateJobStatus,
    goToNextPage,
    goToPrevPage,
    goToPage,
    setTrackerData,
  };
}
