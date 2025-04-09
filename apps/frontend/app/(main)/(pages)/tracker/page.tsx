"use client";

import React, { useEffect, useState, useCallback, JSX } from "react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { Toaster, toast } from "react-hot-toast";

import JobToolbar from "./components/jobtoolbar";
import { JobTable } from "./components/jobtable";
import PaginationControls from "./components/pagination";
import { ChartsSection } from "./components/chartsection";
import TrackerHeader from "./components/trackheader";
import { Job, RoleType, JobStatus } from "@/types/job";
import { TrackerData } from "@/types/tracker";
import { APIResponse, BackendJob, TrackerAPIResponse, AddJobResponse, UpdateJobResponse } from "@/types/api";
import ConfirmationDialog from "./components/confirmationdialog";

const ITEMS_PER_PAGE = 4;

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
    itemsPerPage: ITEMS_PER_PAGE,
    totalPages: 1,
  },
  scrapeInfo: {
    scraping: false,
    scrapeProgress: 0,
    estimatedSeconds: 0,
  },
  health: { isHealthy: false },
};

export default function TrackerPage(): JSX.Element {
  const BASE_URL: string = process.env.NEXT_PUBLIC_API_URL ?? "";
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [trackerData, setTrackerData] = useState<TrackerData>(defaultTrackerData);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add states for toolbar filters
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<string>("desc");
  const [groupByCompany, setGroupByCompany] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState<boolean>(false);
  const [filterNotApplied, setFilterNotApplied] = useState<boolean>(false);
  const [filterWithinWeek, setFilterWithinWeek] = useState<boolean>(false);
  const [filterIntern, setFilterIntern] = useState<boolean>(false);
  const [filterNewgrad, setFilterNewgrad] = useState<boolean>(false);

  // Add state for managing the confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionMonths, setDeletionMonths] = useState(0);

  const fetchTrackerData = useCallback(
    async (page: number): Promise<void> => {
      setLoading(true);
      try {
        // Build query parameters with all filters
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(ITEMS_PER_PAGE),
          sort_by: sortBy,
          sort_direction: sortDirection,
          show_archived: showArchived ? "1" : "0",
          show_priority: showPriorityOnly ? "1" : "0",
          filter_not_applied: filterNotApplied ? "1" : "0",
          filter_within_week: filterWithinWeek ? "1" : "0",
          filter_intern: filterIntern ? "1" : "0",
          filter_newgrad: filterNewgrad ? "1" : "0",
          group_by_company: groupByCompany ? "1" : "0",
        });

        const response: Response = await fetch(`${BASE_URL}/api/tracker?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tracker data");
        }
        const data = (await response.json()) as TrackerAPIResponse;

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch tracker data");
        }

        // Add isModifying flag to each job for the UI state
        const jobsWithUIState = data.trackerData.jobs.map((job) => ({
          ...job,
          isModifying: false,
        }));

        setTrackerData({
          ...data.trackerData,
          jobs: jobsWithUIState,
          pagination: {
            ...data.trackerData.pagination,
            currentPage: page,
          },
        });

        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data. Using cached or initial data.");
      } finally {
        setLoading(false);
      }
    },
    [
      BASE_URL,
      sortBy,
      sortDirection,
      showArchived,
      showPriorityOnly,
      filterNotApplied,
      filterWithinWeek,
      filterIntern,
      filterNewgrad,
      groupByCompany,
    ],
  );

  useEffect(() => {
    void fetchTrackerData(currentPage);
  }, [currentPage, fetchTrackerData]);

  useEffect(() => {
    // Reset to page 1 when filter changes to avoid empty pages
    setCurrentPage(1);
  }, [
    sortBy,
    sortDirection,
    showArchived,
    showPriorityOnly,
    filterNotApplied,
    filterWithinWeek,
    filterIntern,
    filterNewgrad,
    groupByCompany,
  ]);

  const goToNextPage = (): void => {
    if (currentPage < trackerData.pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= trackerData.pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  const addJob = async (job: Job): Promise<AddJobResponse> => {
    try {
      // Convert frontend job format to backend format
      const backendJob: BackendJob = {
        company: { name: job.company },
        title: job.title,
        role_type: job.role_type ?? "newgrad",
        status: getStatusFromIndex(job.statusIndex),
        posted_date: job.postedDate,
        link: job.link,
        priority: job.priority,
        archived: job.archived,
        ats_score: job.atsScore || 0,
        tags: job.tags || [],
      };

      const response: Response = await fetch(`${BASE_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: backendJob }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as APIResponse;
        throw new Error(errorData.error || "Failed to add job");
      }

      const result = (await response.json()) as AddJobResponse;

      // Refresh data after adding a job
      toast.success("Job added successfully!");
      await fetchTrackerData(1); // Go to first page to see the new job
      return result;
    } catch (error) {
      console.error("Error adding job:", error);
      toast.error("Failed to add job: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const updateJob = async (id: number, job: Partial<Job>): Promise<UpdateJobResponse> => {
    try {
      // Convert frontend job format to backend format
      const backendJob: BackendJob = {};

      if (job.company !== undefined) backendJob.company = { name: job.company };
      if (job.title !== undefined) backendJob.title = job.title;
      if (job.role_type !== undefined) {
        backendJob.role_type = job.role_type;
      }
      if (job.statusIndex !== undefined) backendJob.status = getStatusFromIndex(job.statusIndex);
      if (job.postedDate !== undefined) backendJob.posted_date = job.postedDate;
      if (job.link !== undefined) backendJob.link = job.link;
      if (job.priority !== undefined) backendJob.priority = job.priority;
      if (job.archived !== undefined) backendJob.archived = job.archived;
      if (job.atsScore !== undefined) backendJob.ats_score = job.atsScore;
      if (job.tags !== undefined) backendJob.tags = job.tags;

      const response: Response = await fetch(`${BASE_URL}/api/jobs/${String(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: backendJob }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as APIResponse;
        throw new Error(errorData.error || "Failed to update job");
      }

      const result = (await response.json()) as UpdateJobResponse;

      // Refresh data after updating
      toast.success("Job updated successfully!");
      await fetchTrackerData(currentPage);
      return result;
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const archiveJob = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/archive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as APIResponse;
        throw new Error(errorData.error || "Failed to archive job");
      }

      toast.success("Job archived successfully!");
      await fetchTrackerData(currentPage);
    } catch (error) {
      console.error("Error archiving job:", error);
      toast.error("Failed to archive job: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const togglePriorityJob = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/priority`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as APIResponse;
        throw new Error(errorData.error || "Failed to toggle priority");
      }

      toast.success("Priority updated!");
      await fetchTrackerData(currentPage);
    } catch (error) {
      console.error("Error toggling priority:", error);
      toast.error("Failed to update priority: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const deleteJob = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/soft-delete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as APIResponse;
        throw new Error(errorData.error || "Failed to delete job");
      }

      toast.success("Job deleted successfully!");
      await fetchTrackerData(currentPage);
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Convert status index to status string for backend
  const getStatusFromIndex = (statusIndex: number): JobStatus => {
    const statuses: JobStatus[] = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
    return statusIndex >= 0 && statusIndex < statuses.length ? statuses[statusIndex] : "nothing_done";
  };

  // Convert role_type to backend format
  const getRoleTypeFromString = (roleType: string): RoleType => {
    return roleType === "intern" ? "intern" : "newgrad";
  };

  const handleAddNewJob = (): void => {
    const today = new Date();
    const formattedDate = format(today, "dd.MM.yyyy");

    const newJob: Job = {
      id: -Date.now(),
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

    setTrackerData((prev) => {
      const updatedJobs = [newJob, ...prev.jobs.slice(0, prev.pagination.itemsPerPage - 1)];
      return {
        ...prev,
        jobs: updatedJobs,
      };
    });
  };

  const handleUpdateJob = (id: number, updatedFields: Partial<Job>): void => {
    setTrackerData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job)),
    }));
  };

  const handleSaveJob = async (id: number): Promise<void> => {
    const jobToSave = trackerData.jobs.find((job) => job.id === id);
    if (!jobToSave) return;

    const { isModifying, ...jobData } = jobToSave;

    try {
      if (id < 0) {
        const jobWithStatus = {
          ...jobData,
          status: getStatusFromIndex(jobData.statusIndex),
        };
        await addJob(jobWithStatus as Job);
      } else {
        await updateJob(id, jobData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelModifyJob = (id: number): void => {
    if (id < 0) {
      setTrackerData((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((job) => job.id !== id),
      }));
    } else {
      setTrackerData((prev) => ({
        ...prev,
        jobs: prev.jobs.map((job) => (job.id === id ? { ...job, isModifying: false } : job)),
      }));
    }
  };

  const handleScrape = (): void => {
    if (trackerData.scrapeInfo.scraping) {
      void (async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/scrape/cancel`, { method: "POST" });
          if (!response.ok) throw new Error("Failed to cancel scrape");

          const data = (await response.json()) as APIResponse;
          if (data.success) {
            toast.success("Scrape cancelled");
            await fetchTrackerData(currentPage);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to cancel scrape");
        }
      })();
    } else {
      void (async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/scrape`, { method: "POST" });
          if (!response.ok) throw new Error("Failed to start scrape");

          const data = (await response.json()) as APIResponse;
          if (data.success) {
            toast.success("Scrape started");

            const interval = setInterval(() => {
              void (async () => {
                try {
                  const statusResponse = await fetch(`${BASE_URL}/api/scrape/status`);
                  const statusData = (await statusResponse.json()) as APIResponse;

                  if (!statusData.scraping) {
                    clearInterval(interval);
                    await fetchTrackerData(1);
                    toast.success("Scrape completed!");
                  }
                } catch (error) {
                  console.error("Error checking scrape status:", error);
                }
              })();
            }, 2000);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to start scrape");
        }
      })();
    }
  };

  const handleDeleteOlderThan = (months: number): void => {
    setDeletionMonths(months);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOlderThan = (): void => {
    const months = deletionMonths;
    const monthsStr = String(months);

    void (async () => {
      try {
        toast.loading("Deleting old data...");
        const response = await fetch(`${BASE_URL}/api/jobs/delete-older-than/${monthsStr}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to delete old data");
        }

        const result = (await response.json()) as { deleted_count: number };
        toast.dismiss();
        toast.success(`Successfully deleted ${String(result.deleted_count)} jobs older than ${monthsStr} months`);

        // Refresh the data
        await fetchTrackerData(1);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to delete data: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error deleting old data:", error);
      }
    })();
  };

  // Add new handlers for the additional actions
  const handleRemoveDeadLinks = (): void => {
    void (async () => {
      try {
        toast.loading("Checking for dead links...");
        const response = await fetch(`${BASE_URL}/api/jobs/remove-dead-links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to remove dead links");
        }

        const result = (await response.json()) as { removed_count: number };
        toast.dismiss();
        toast.success(`Successfully removed ${String(result.removed_count)} dead links`);

        // Refresh the data
        await fetchTrackerData(currentPage);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to remove dead links: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error removing dead links:", error);
      }
    })();
  };

  const handleArchiveRejected = (): void => {
    void (async () => {
      try {
        toast.loading("Archiving rejected applications...");
        const response = await fetch(`${BASE_URL}/api/jobs/archive-rejected`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to archive rejected applications");
        }

        const result = (await response.json()) as { archived_count: number };
        toast.dismiss();
        toast.success(`Successfully archived ${String(result.archived_count)} rejected applications`);

        // Refresh the data
        await fetchTrackerData(currentPage);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to archive applications: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error archiving applications:", error);
      }
    })();
  };

  const handleArchiveAppliedOlderThan = (months: number): void => {
    const monthsStr = String(months);

    void (async () => {
      try {
        toast.loading(`Archiving applied jobs older than ${monthsStr} months...`);
        const response = await fetch(`${BASE_URL}/api/jobs/archive-applied-older-than/${monthsStr}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to archive applied jobs");
        }

        const result = (await response.json()) as { archived_count: number };
        toast.dismiss();
        toast.success(
          `Successfully archived ${String(result.archived_count)} applied jobs older than ${monthsStr} months`,
        );

        // Refresh the data
        await fetchTrackerData(currentPage);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to archive jobs: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error archiving jobs:", error);
      }
    })();
  };

  const handleMarkOldestAsPriority = (): void => {
    void (async () => {
      try {
        toast.loading("Marking oldest 50 jobs as priority...");
        const response = await fetch(`${BASE_URL}/api/jobs/mark-oldest-as-priority`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to mark jobs as priority");
        }

        const result = (await response.json()) as { marked_count: number };
        toast.dismiss();
        toast.success(`Successfully marked ${String(result.marked_count)} oldest jobs as priority`);

        // Refresh the data
        await fetchTrackerData(currentPage);
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to mark jobs: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error marking jobs:", error);
      }
    })();
  };

  if (loading) {
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
          onScrape={handleScrape}
          onDeleteOlderThan={handleDeleteOlderThan}
          onRemoveDeadLinks={handleRemoveDeadLinks}
          onArchiveRejected={handleArchiveRejected}
          onArchiveAppliedOlderThan={handleArchiveAppliedOlderThan}
          onMarkOldestAsPriority={handleMarkOldestAsPriority}
        />

        <JobToolbar
          sortBy={sortBy}
          setSortBy={setSortBy}
          groupByCompany={groupByCompany}
          setGroupByCompany={setGroupByCompany}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          showPriorityOnly={showPriorityOnly}
          setShowPriorityOnly={setShowPriorityOnly}
          onAddNewJob={handleAddNewJob}
        />

        <JobTable
          jobs={trackerData.jobs}
          currentPage={trackerData.pagination.currentPage}
          itemsPerPage={trackerData.pagination.itemsPerPage}
          setTotalJobs={(total) => {}}
          onUpdateJob={handleUpdateJob}
          onSaveJob={(id) => {
            void handleSaveJob(id);
          }}
          onCancelModifyJob={handleCancelModifyJob}
          onArchiveJob={(id) => {
            void archiveJob(id);
          }}
          onDeleteJob={(id) => {
            void deleteJob(id);
          }}
          onTogglePriorityJob={(id) => {
            void togglePriorityJob(id);
          }}
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
        onConfirm={confirmDeleteOlderThan}
        title="Delete Old Job Data"
        description={`Are you sure you want to delete all job data older than ${String(deletionMonths)} months? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-16 bg-gray-500 rounded w-full"></div>
      <div className="h-20 bg-gray-500 rounded w-full"></div>
      <div className="h-72 bg-gray-500 rounded w-full"></div>
      <div className="flex gap-4">
        <div className="h-40 bg-gray-500 rounded w-1/2"></div>
        <div className="h-40 bg-gray-500 rounded w-1/2"></div>
      </div>
    </div>
  );
}
