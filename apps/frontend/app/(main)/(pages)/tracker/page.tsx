"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import JobToolbar from "./components/jobtoolbar";
import { JobTable } from "./components/jobtable";
import PaginationControls from "./components/pagination";
import { ChartsSection } from "./components/chartsection";
import TrackerHeader from "./components/trackheader";
import ConfirmationDialog from "./components/confirmationdialog";
import FilterBadges from "./components/filterbadges";
import { TableLoadingSkeleton, LoadingSkeleton } from "@/components/ui/skeletonloaders";
import { useTrackerData } from "./hooks/useTrackerData";
import { useJobManager } from "./hooks/useJobManager";
import { useBulkActions } from "./hooks/useBulkActions";
import { TrackerFilters } from "@/types/trackerHooks";

const ITEMS_PER_PAGE = 4;

export default function TrackerPage(): JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deletionMonths, setDeletionMonths] = useState<number>(0);
  const [focusedJobId, setFocusedJobId] = useState<number | null>(null);

  const {
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
  } = useTrackerData({ initialPage: 1, itemsPerPage: ITEMS_PER_PAGE });

  const { handleAddNewJob, handleCancelModifyJob, handleSaveJob } = useJobManager({
    trackerJobs: trackerData.jobs,
    updateLocalJob,
    setTrackerJobs: (jobs) => setTrackerData((prev) => ({ ...prev, jobs })),
  });

  const {
    handleDeleteOlderThan,
    handleArchiveRejected,
    handleArchiveAppliedOlderThan,
    handleMarkOldestAsPriority,
    handleScrape,
    handleRemoveDeadLinks,
  } = useBulkActions({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    refreshData: () => Promise.resolve(),
  });

  const { sortBy, sortDirection, showArchived, showPriorityOnly, groupByCompany } = filters;

  const addNewJobHandler = useCallback(() => {
    handleAddNewJob((jobs) => {
      setTrackerData((prev) => ({ ...prev, jobs }));
    });
  }, [handleAddNewJob, setTrackerData]);

  const cancelModifyJobHandler = useCallback(
    (id: number) => {
      const job = trackerData.jobs.find((j) => j.id === id);
      if (job) {
        handleCancelModifyJob(job, () => {
          setTrackerData((prev) => ({ ...prev, jobs: prev.jobs }));
        });
      }
    },
    [trackerData.jobs, handleCancelModifyJob, setTrackerData],
  );

  const handleSelectTag = useCallback(
    (tag: string | null) => {
      updateFilters({ selectedTag: tag });
    },
    [updateFilters],
  );

  const refreshTagsRef = useRef<(() => Promise<void>) | null>(null);
  const setRefreshTagsRef = useCallback((refreshFn: () => Promise<void>) => {
    refreshTagsRef.current = refreshFn;
  }, []);
  const refreshTagsIfNeeded = useCallback(async () => {
    if (refreshTagsRef.current) await refreshTagsRef.current();
  }, []);

  const saveJobHandler = useCallback(
    async (id: number) => {
      await handleSaveJob(id);
      if (refreshTagsRef.current) await refreshTagsRef.current();
    },
    [handleSaveJob],
  );

  const handleOpenDeleteDialog = useCallback((months: number) => {
    setDeletionMonths(months);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteOlderThan = useCallback(async () => {
    await handleDeleteOlderThan(deletionMonths);
    setDeleteDialogOpen(false);
  }, [deletionMonths, handleDeleteOlderThan]);

  const handleDeleteWithTagRefresh = useCallback(async (id: number) => {
    updateLocalJob(id, { deleted: true });
    if (refreshTagsRef.current) await refreshTagsRef.current();
  }, [updateLocalJob]);

  const handleArchiveWithTagRefresh = useCallback(async (id: number) => {
    updateLocalJob(id, { archived: true });
    if (refreshTagsRef.current) await refreshTagsRef.current();
  }, [updateLocalJob]);

  const onScrapeHandler = useCallback(() => {
    void handleScrape(trackerData.scrapeInfo.scraping);
  }, [handleScrape, trackerData.scrapeInfo.scraping]);

  const handleEditFocusedJob = useCallback(() => {
    if (focusedJobId) {
      updateLocalJob(focusedJobId, { isModifying: true });
    }
  }, [focusedJobId, updateLocalJob]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "s" && (event.metaKey || event.getModifierState("Meta"))) {
        event.preventDefault();
        onScrapeHandler();
        return;
      }
      if (event.ctrlKey && event.key === " ") {
        event.preventDefault();
        addNewJobHandler();
        return;
      }
      if (event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            goToPrevPage();
            break;
          case "ArrowRight":
            event.preventDefault();
            goToNextPage();
            break;
          default:
            break;
        }
      }
      if (event.ctrlKey && event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case "e":
            event.preventDefault();
            handleEditFocusedJob();
            break;
          case "a":
            event.preventDefault();
            if (focusedJobId) void handleArchiveWithTagRefresh(focusedJobId);
            break;
          case "d":
            event.preventDefault();
            if (focusedJobId) void handleDeleteWithTagRefresh(focusedJobId);
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goToNextPage,
    goToPrevPage,
    addNewJobHandler,
    focusedJobId,
    handleArchiveWithTagRefresh,
    handleDeleteWithTagRefresh,
    handleEditFocusedJob,
    onScrapeHandler,
  ]);

  const headerProps = {
    isHealthy: trackerData.health.isHealthy,
    scraping: trackerData.scrapeInfo.scraping,
    scrapeProgress: trackerData.scrapeInfo.scrapeProgress,
    estimatedSeconds: trackerData.scrapeInfo.estimatedSeconds,
    onScrape: onScrapeHandler,
    onDeleteOlderThan: handleOpenDeleteDialog,
    onRemoveDeadLinks: () => void handleRemoveDeadLinks(),
    onArchiveRejected: () => void handleArchiveRejected(),
    onArchiveAppliedOlderThan: (months: number) => void handleArchiveAppliedOlderThan(months),
    onMarkOldestAsPriority: () => void handleMarkOldestAsPriority(),
  };

  if (isInitialLoading) return <LoadingSkeleton />;

  return (
    <div className="p-4">
      {error && (
        <div className={`px-4 py-3 rounded mb-4 ${isDark ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-100 border border-red-400 text-red-700"}`} role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <Toaster toastOptions={{ style: { maxWidth: "500px", background: isDark ? "#111" : "#fff", color: isDark ? "#fff" : "#000", border: isDark ? "1px solid #333" : "1px solid #ddd" }}} />
      <div className="flex flex-col gap-4">
        <TrackerHeader {...headerProps} />
        <JobToolbar filters={filters} updateFilters={updateFilters} onAddNewJob={addNewJobHandler} />
        <FilterBadges onSelectTag={handleSelectTag} selectedTag={filters.selectedTag} onRefreshTagsFunc={setRefreshTagsRef} />
        {loading ? (
          <TableLoadingSkeleton />
        ) : (
          <JobTable
            jobs={trackerData.jobs}
            currentPage={trackerData.pagination.currentPage}
            itemsPerPage={trackerData.pagination.itemsPerPage}
            setTotalJobs={() => {}}
            onUpdateJob={updateLocalJob}
            onSaveJob={(id) => void saveJobHandler(id)}
            onCancelModifyJob={cancelModifyJobHandler}
            onArchiveJob={(id) => void handleArchiveWithTagRefresh(id)}
            onDeleteJob={(id) => void handleDeleteWithTagRefresh(id)}
            onTogglePriorityJob={(id) => void {}}
            onUpdateJobStatusArrow={(id, direction) => void {}}
            statusCounts={trackerData.statusCounts}
            groupByCompany={filters.groupByCompany}
            onFocusJob={setFocusedJobId}
          />
        )}
        <PaginationControls currentPage={trackerData.pagination.currentPage} totalPages={trackerData.pagination.totalPages} onPrev={goToPrevPage} onNext={goToNextPage} onGoToPage={goToPage} />
        <ChartsSection statusCounts={trackerData.statusCounts} />
      </div>
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => void confirmDeleteOlderThan()}
        title="Delete Old Job Data"
        description={`Are you sure you want to delete all job data older than ${deletionMonths} months? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
