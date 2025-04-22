"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
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

const ITEMS_PER_PAGE = 4;

export default function TrackerPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionMonths, setDeletionMonths] = useState(0);
  const [focusedJobId, setFocusedJobId] = useState<number | null>(null);

  const {
    trackerData,
    setTrackerData,
    loading,
    isInitialLoading,
    error,
    filters,
    updateFilters,
    goToNextPage,
    goToPrevPage,
    goToPage,
    updateLocalJob,
    handleTogglePriority,
    handleUpdateJobStatus,
    handleArchiveToggle,
    handleDeleteJob,
    isJobProcessing,
    loadTrackerData,
  } = useTrackerData({ initialPage: 1, itemsPerPage: ITEMS_PER_PAGE });

  const { handleAddNewJob, handleCancelModifyJob, handleSaveJob, storeOriginalJob } = useJobManager({
    trackerJobs: trackerData.jobs,
    updateLocalJob,
    setTrackerJobs: (jobs) => setTrackerData((prev) => ({ ...prev, jobs })),
    setTrackerData,
  });

  const {
    handleDeleteOlderThan,
    handleArchiveRejected,
    handleArchiveAppliedOlderThan,
    handleMarkOldestAsPriority,
    handleScrape,
    handleRemoveDeadLinks,
  } = useBulkActions({ refreshData: loadTrackerData });

  const { selectedTag, groupByCompany } = filters;

  const addNewJobHandler = useCallback(() => {
    handleAddNewJob();
  }, [handleAddNewJob]);

  const cancelModifyJobHandler = useCallback(
    (id: number) => {
      const job = trackerData.jobs.find((j) => j.id === id);
      if (job) {
        handleCancelModifyJob(job);
      }
    },
    [trackerData.jobs, handleCancelModifyJob],
  );

  const handleSelectTag = useCallback(
    (tag: string | null) => {
      updateFilters({ selectedTag: tag });
    },
    [updateFilters],
  );

  const refreshTagsRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const setRefreshTagsRef = useCallback((fn: () => Promise<void>) => {
    refreshTagsRef.current = fn;
  }, []);
  const refreshTagsIfNeeded = useCallback(async () => {
    if (refreshTagsRef.current) {
      await refreshTagsRef.current();
    }
  }, []);

  const saveJobHandler = useCallback(
    async (id: number) => {
      await handleSaveJob(id);
    },
    [handleSaveJob],
  );

  const handleOpenDeleteDialog = useCallback((months: number) => {
    setDeletionMonths(months);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteOlderThan = useCallback(() => {
    handleDeleteOlderThan(deletionMonths);
    setDeleteDialogOpen(false);
  }, [deletionMonths, handleDeleteOlderThan]);

  const handleDeleteWithTagRefresh = useCallback(
    async (id: number) => {
      await handleDeleteJob(id);
      await refreshTagsIfNeeded();
    },
    [handleDeleteJob, refreshTagsIfNeeded],
  );

  const onScrapeHandler = useCallback(() => {
    handleScrape(trackerData.scrapeInfo.scraping);
  }, [handleScrape, trackerData.scrapeInfo.scraping]);

  const handleEditFocusedJob = useCallback(() => {
    if (focusedJobId !== null) {
      storeOriginalJob(focusedJobId);
      updateLocalJob(focusedJobId, { isModifying: true });
    }
  }, [focusedJobId, updateLocalJob, storeOriginalJob]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === " ") {
        e.preventDefault();
        addNewJobHandler();
      }
      if (e.ctrlKey && !e.shiftKey) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goToPrevPage();
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goToNextPage();
        }
      }
      if (e.ctrlKey && e.shiftKey) {
        const code = e.code;
        switch (code) {
          case "KeyE":
            e.preventDefault();
            handleEditFocusedJob();
            break;
          case "KeyA":
            e.preventDefault();
            if (focusedJobId !== null) {
              handleArchiveToggle(focusedJobId).catch((err: unknown) => console.error("Archive toggle error:", err));
            }
            break;
          case "KeyD":
            e.preventDefault();
            if (focusedJobId !== null) {
              handleDeleteWithTagRefresh(focusedJobId).catch((err: unknown) =>
                console.error("Delete with tag refresh error:", err),
              );
            }
            break;
          case "Digit1":
            e.preventDefault();
            updateFilters({ filterNotApplied: !filters.filterNotApplied });
            break;
          case "Digit2":
            e.preventDefault();
            updateFilters({ filterWithinWeek: !filters.filterWithinWeek });
            break;
          case "Digit3":
            e.preventDefault();
            updateFilters({ filterIntern: !filters.filterIntern });
            break;
          case "Digit4":
            e.preventDefault();
            updateFilters({ filterNewgrad: !filters.filterNewgrad });
            break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    addNewJobHandler,
    goToNextPage,
    goToPrevPage,
    onScrapeHandler,
    handleEditFocusedJob,
    handleArchiveToggle,
    handleDeleteWithTagRefresh,
    focusedJobId,
    updateFilters,
    filters.filterNotApplied,
    filters.filterWithinWeek,
    filters.filterIntern,
    filters.filterNewgrad,
  ]);

  const headerProps = {
    isHealthy: trackerData.health.isHealthy,
    scraping: trackerData.scrapeInfo.scraping,
    scrapeProgress: trackerData.scrapeInfo.scrapeProgress,
    estimatedSeconds: trackerData.scrapeInfo.estimatedSeconds,
    onScrape: onScrapeHandler,
    onDeleteOlderThan: handleOpenDeleteDialog,
    onRemoveDeadLinks: handleRemoveDeadLinks,
    onArchiveRejected: handleArchiveRejected,
    onArchiveAppliedOlderThan: handleArchiveAppliedOlderThan,
    onMarkOldestAsPriority: handleMarkOldestAsPriority,
  };

  if (isInitialLoading) return <LoadingSkeleton />;

  return (
    <div className="p-4">
      {error && (
        <div
          className={`px-4 py-3 mb-4 rounded ${
            isDark ? "bg-red-900 border-red-700 text-red-200" : "bg-red-100 border-red-400 text-red-700"
          }`}
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      <Toaster
        toastOptions={{
          style: {
            maxWidth: 500,
            background: isDark ? "#111" : "#fff",
            color: isDark ? "#fff" : "#000",
            border: isDark ? "1px solid #333" : "1px solid #ddd",
          },
        }}
      />
      <div className="flex flex-col gap-4">
        <TrackerHeader {...headerProps} />
        <JobToolbar filters={filters} updateFilters={updateFilters} onAddNewJob={addNewJobHandler} />
        <FilterBadges onSelectTag={handleSelectTag} selectedTag={selectedTag} onRefreshTagsFunc={setRefreshTagsRef} />
        {loading ? (
          <TableLoadingSkeleton />
        ) : (
          <JobTable
            jobs={trackerData.jobs}
            currentPage={trackerData.pagination.currentPage}
            itemsPerPage={trackerData.pagination.itemsPerPage}
            setTotalJobs={() => {}}
            onUpdateJob={(id, fields) => {
              if (fields.isModifying) {
                storeOriginalJob(id);
              }
              updateLocalJob(id, fields);
              if (fields.tags !== undefined) {
                refreshTagsIfNeeded().catch((err: unknown) => console.error("Failed to refresh tags:", err));
              }
            }}
            onSaveJob={(id) => {
              saveJobHandler(id).catch((err: unknown) => console.error("Save job error:", err));
            }}
            onCancelModifyJob={(id) => cancelModifyJobHandler(id)}
            onArchiveJob={(id) => {
              handleArchiveToggle(id).catch((err: unknown) => console.error("Archive job error:", err));
            }}
            onDeleteJob={(id) => {
              handleDeleteWithTagRefresh(id).catch((err: unknown) => console.error("Delete job error:", err));
            }}
            onTogglePriorityJob={(id) => {
              handleTogglePriority(id).catch((err: unknown) => console.error("Toggle priority error:", err));
            }}
            onUpdateJobStatusArrow={(id, dir) => {
              handleUpdateJobStatus(id, dir).catch((err: unknown) => console.error("Update job status error:", err));
            }}
            statusCounts={trackerData.statusCounts}
            groupByCompany={groupByCompany}
            onFocusJob={setFocusedJobId}
            isJobProcessing={isJobProcessing}
          />
        )}
        <PaginationControls
          currentPage={trackerData.pagination.currentPage}
          totalPages={trackerData.pagination.totalPages}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
          onGoToPage={goToPage}
        />
        <ChartsSection statusCounts={trackerData.statusCounts} />
      </div>
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteOlderThan}
        title="Delete Old Job Data"
        description={`Delete all job data older than ${String(deletionMonths)} months? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
