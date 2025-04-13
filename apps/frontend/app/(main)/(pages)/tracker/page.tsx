"use client";

/**
 * JobFlow Tracker Page
 *
 * Optimizations:
 * - Uses client-side state updates for most job actions like:
 *   - Toggling priority status
 *   - Archiving jobs
 *   - Updating job status
 *   - Deleting jobs
 *   - Modifying job details
 *
 * - Only refetches data when necessary, such as:
 *   - Initial page load
 *   - Pagination
 *   - Filter changes
 *   - Bulk operations that affect multiple jobs
 *
 * This approach improves performance by reducing unnecessary API calls
 * and providing immediate UI feedback to the user.
 */

import React, { JSX } from "react";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

import JobToolbar from "./components/jobtoolbar";
import { JobTable } from "./components/jobtable";
import PaginationControls from "./components/pagination";
import { ChartsSection } from "./components/chartsection";
import TrackerHeader from "./components/trackheader";
import ConfirmationDialog from "./components/confirmationdialog";
import FilterBadges from "./components/filterbadges";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Import our custom hooks
import { useTrackerData } from "./hooks/useTrackerData";
import { useJobManager } from "./hooks/useJobManager";
import { useBulkActions } from "./hooks/useBulkActions";
import { TrackerFilters } from "@/types/trackerHooks";

const ITEMS_PER_PAGE = 4;

// Create a wrapper component for the JobToolbar
function JobToolbarWrapper({
  sortBy,
  sortDirection,
  groupByCompany,
  showArchived,
  showPriorityOnly,
  onAddNewJob,
  updateFilters,
  filters,
}: {
  sortBy: string;
  sortDirection: string;
  groupByCompany: boolean;
  showArchived: boolean;
  showPriorityOnly: boolean;
  onAddNewJob: () => void;
  updateFilters: (filters: Partial<TrackerFilters>) => void;
  filters: TrackerFilters;
}) {
  // Create state setters that satisfy the JobToolbarProps interface
  const setSortBy = useState<string>(sortBy)[1];
  const setSortDirection = useState<string>(sortDirection)[1];
  const setGroupByCompany = useState<boolean>(groupByCompany)[1];
  const setShowArchived = useState<boolean>(showArchived)[1];
  const setShowPriorityOnly = useState<boolean>(showPriorityOnly)[1];

  // Override the setter functions to call updateFilters instead
  const handleSetSortBy = (value: React.SetStateAction<string>) => {
    const newValue = typeof value === "function" ? value(sortBy) : value;
    updateFilters({ sortBy: newValue });
    setSortBy(value);
  };

  const handleSetSortDirection = (value: React.SetStateAction<string>) => {
    const newValue = typeof value === "function" ? value(sortDirection) : value;
    updateFilters({ sortDirection: newValue });
    setSortDirection(value);
  };

  const handleSetGroupByCompany = (value: React.SetStateAction<boolean>) => {
    const newValue = typeof value === "function" ? value(groupByCompany) : value;
    updateFilters({ groupByCompany: newValue });
    setGroupByCompany(value);
  };

  const handleSetShowArchived = (value: React.SetStateAction<boolean>) => {
    const newValue = typeof value === "function" ? value(showArchived) : value;
    updateFilters({ showArchived: newValue });
    setShowArchived(value);
  };

  const handleSetShowPriorityOnly = (value: React.SetStateAction<boolean>) => {
    const newValue = typeof value === "function" ? value(showPriorityOnly) : value;
    updateFilters({ showPriorityOnly: newValue });
    setShowPriorityOnly(value);
  };

  return (
    <JobToolbar
      sortBy={sortBy}
      setSortBy={handleSetSortBy}
      sortDirection={sortDirection}
      setSortDirection={handleSetSortDirection}
      groupByCompany={groupByCompany}
      setGroupByCompany={handleSetGroupByCompany}
      showArchived={showArchived}
      setShowArchived={handleSetShowArchived}
      showPriorityOnly={showPriorityOnly}
      setShowPriorityOnly={handleSetShowPriorityOnly}
      onAddNewJob={onAddNewJob}
      updateFilters={updateFilters}
      filters={filters}
    />
  );
}

export default function TrackerPage(): JSX.Element {
  const BASE_URL: string = process.env.NEXT_PUBLIC_API_URL ?? "";
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Add state for managing the confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletionMonths, setDeletionMonths] = React.useState(0);

  // Use our custom hooks
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
    handleArchiveJob,
    handleTogglePriority,
    handleDeleteJob,
    handleUpdateJobStatus,
    refreshData,
  } = useTrackerData({
    initialPage: 1,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Use job manager hook for job CRUD operations
  const { handleAddNewJob, handleSaveJob, handleCancelModifyJob } = useJobManager({
    updateLocalJob,
    refreshData,
    trackerData,
    setTrackerData,
  });

  // Use bulk actions hook for batch operations
  const {
    handleDeleteOlderThan,
    handleRemoveDeadLinks,
    handleArchiveRejected,
    handleArchiveAppliedOlderThan,
    handleMarkOldestAsPriority,
    handleScrape,
  } = useBulkActions({
    baseUrl: BASE_URL,
    refreshData,
  });

  // Extract props from filters for clarity
  const { sortBy, sortDirection, showArchived, showPriorityOnly, groupByCompany } = filters;

  // Function to handle adding a new job
  const addNewJobHandler = () => {
    handleAddNewJob(trackerData.jobs, (newJobs) => {
      setTrackerData((prev) => ({
        ...prev,
        jobs: newJobs,
      }));
    });
  };

  // Function to handle canceling job modification
  const cancelModifyJobHandler = (id: number) => {
    const job = trackerData.jobs.find((j) => j.id === id);
    if (job) {
      handleCancelModifyJob(job, trackerData.jobs, (newJobs) => {
        setTrackerData((prev) => ({
          ...prev,
          jobs: newJobs,
        }));
      });
    }
  };

  // Function to handle saving a job
  const saveJobHandler = async (id: number) => {
    const jobToSave = trackerData.jobs.find((job) => job.id === id);
    if (jobToSave) {
      await handleSaveJob(jobToSave);
    }
  };

  // Handle folder and tag filtering
  const handleSelectFolder = (folderId: number | null) => {
    updateFilters({ selectedFolder: folderId });
  };

  const handleSelectTag = (tag: string | null) => {
    updateFilters({ selectedTag: tag });
  };

  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (months: number) => {
    setDeletionMonths(months);
    setDeleteDialogOpen(true);
  };

  // Handle confirming deletion of old jobs
  const confirmDeleteOlderThan = async () => {
    await handleDeleteOlderThan(deletionMonths);
    setDeleteDialogOpen(false);
  };

  // Show full page skeleton on initial load only
  if (isInitialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4">
      {error && (
        <div
          className={`px-4 py-3 rounded mb-4 ${
            isDark ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-100 border border-red-400 text-red-700"
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
            maxWidth: "500px",
            background: isDark ? "#111" : "#fff",
            color: isDark ? "#fff" : "#000",
            border: isDark ? "1px solid #333" : "1px solid #ddd",
          },
        }}
      />

      <div className="flex flex-col gap-4">
        <TrackerHeader
          isHealthy={trackerData.health.isHealthy}
          scraping={trackerData.scrapeInfo.scraping}
          scrapeProgress={trackerData.scrapeInfo.scrapeProgress}
          estimatedSeconds={trackerData.scrapeInfo.estimatedSeconds}
          onScrape={() => {
            void handleScrape(trackerData.scrapeInfo.scraping);
          }}
          onDeleteOlderThan={(months) => {
            handleOpenDeleteDialog(months);
          }}
          onRemoveDeadLinks={() => {
            void handleRemoveDeadLinks();
          }}
          onArchiveRejected={() => {
            void handleArchiveRejected();
          }}
          onArchiveAppliedOlderThan={(months) => {
            void handleArchiveAppliedOlderThan(months);
          }}
          onMarkOldestAsPriority={() => {
            void handleMarkOldestAsPriority();
          }}
        />

        <JobToolbarWrapper
          sortBy={sortBy}
          sortDirection={sortDirection}
          groupByCompany={groupByCompany}
          showArchived={showArchived}
          showPriorityOnly={showPriorityOnly}
          onAddNewJob={addNewJobHandler}
          updateFilters={updateFilters}
          filters={filters}
        />

        {/* Only apply loading state to the table component */}
        {loading ? (
          <TableLoadingSkeleton />
        ) : (
          <JobTable
            jobs={trackerData.jobs}
            currentPage={trackerData.pagination.currentPage}
            itemsPerPage={trackerData.pagination.itemsPerPage}
            setTotalJobs={(total) => {}}
            onUpdateJob={updateLocalJob}
            onSaveJob={(id) => {
              void saveJobHandler(id);
            }}
            onCancelModifyJob={cancelModifyJobHandler}
            onArchiveJob={(id) => {
              void handleArchiveJob(id);
            }}
            onDeleteJob={(id) => {
              void handleDeleteJob(id);
            }}
            onTogglePriorityJob={(id) => {
              void handleTogglePriority(id);
            }}
            onUpdateJobStatusArrow={(id, direction) => {
              void handleUpdateJobStatus(id, direction);
            }}
            statusCounts={trackerData.statusCounts}
            groupByCompany={groupByCompany}
          />
        )}

        {/* Always keep filter badges visible during table loading */}
        <FilterBadges
          onSelectFolder={handleSelectFolder}
          onSelectTag={handleSelectTag}
          selectedFolder={filters.selectedFolder as number | null}
          selectedTag={filters.selectedTag as string | null}
        />

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
        onConfirm={() => {
          void confirmDeleteOlderThan();
        }}
        title="Delete Old Job Data"
        description={`Are you sure you want to delete all job data older than ${String(deletionMonths)} months? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

// New component specifically for table loading
function TableLoadingSkeleton(): JSX.Element {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="text-left">
            <TableHead>Company &amp; Job Title</TableHead>
            <TableHead>Posted Date</TableHead>
            <TableHead>Link</TableHead>
            <TableHead>Application Status</TableHead>
            <TableHead>Information</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <TableRow key={index} className="animate-pulse">
                <td className="px-4 py-3" colSpan={6}>
                  <div className="h-12 bg-zinc-800/40 dark:bg-zinc-700/40 rounded w-full"></div>
                </td>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Keep the full page loading skeleton for initial load
function LoadingSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-16 bg-zinc-900 rounded w-full"></div>
      <div className="h-20 bg-zinc-900 rounded w-full"></div>
      <div className="h-72 bg-zinc-900 rounded w-full"></div>
      <div className="flex gap-4">
        <div className="h-40 bg-zinc-900 rounded w-1/2"></div>
        <div className="h-40 bg-zinc-900 rounded w-1/2"></div>
      </div>
    </div>
  );
}
