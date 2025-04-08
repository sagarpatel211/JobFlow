"use client";

import React, { useEffect, useState, useCallback, JSX } from "react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import JobToolbar from "./components/jobtoolbar";
import { JobTable } from "./components/jobtable";
import PaginationControls from "./components/pagination";
import { ChartsSection } from "./components/chartsection";
import { HeartPulse } from "lucide-react";
import { Job } from "@/types/job";

interface StatusCounts {
  nothing_done: number;
  applying: number;
  applied: number;
  OA: number;
  interview: number;
  offer: number;
  rejected: number;
  [key: string]: number;
}

interface PaginationData {
  totalJobs: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface ScrapeInfo {
  scraping: boolean;
  scrapeProgress: number;
  estimatedSeconds: number;
}

interface Health {
  isHealthy: boolean;
}

interface TrackerData {
  jobs: Job[];
  statusCounts: StatusCounts;
  pagination: PaginationData;
  scrapeInfo: ScrapeInfo;
  health: Health;
}

interface TrackerAPIResponse {
  trackerData: TrackerData;
}

interface AddJobResponse {
  success: boolean;
  job: Job;
}

interface UpdateJobResponse {
  success: boolean;
  job: Job;
}

interface ScrapeResponse {
  success: boolean;
  scraping: boolean;
  data?: unknown;
}

interface CancelScrapeResponse {
  success: boolean;
  scraping: boolean;
}

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

  const fetchTrackerData = useCallback(
    async (page: number): Promise<void> => {
      setLoading(true);
      try {
        const response: Response = await fetch(`${BASE_URL}/api/tracker?page=${String(page)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tracker data");
        }
        const data = await response.json() as TrackerAPIResponse;
        setTrackerData({
          ...data.trackerData,
          pagination: { ...data.trackerData.pagination, currentPage: page },
        });
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data. Using cached or initial data.");
      } finally {
        setLoading(false);
      }
    },
    [BASE_URL],
  );

  useEffect(() => {
    void fetchTrackerData(currentPage);
  }, [currentPage, fetchTrackerData]);

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

  const addJob = async (job: Job): Promise<AddJobResponse> => {
    const response: Response = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    if (!response.ok) {
      throw new Error("Failed to add job");
    }
    return (await response.json()) as AddJobResponse;
  };

  const updateJob = async (id: number, job: Job): Promise<UpdateJobResponse> => {
    const response: Response = await fetch(`${BASE_URL}/api/jobs/${String(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    if (!response.ok) {
      throw new Error("Failed to update job");
    }
    return (await response.json()) as UpdateJobResponse;
  };

  const handleAddNewJob = (): void => {
    const newJob: Job = {
      id: -Date.now(),
      company: "",
      title: "",
      postedDate: "",
      link: "",
      statusIndex: 0,
      priority: false,
      isModifying: true,
      archived: false,
      deleted: false,
      atsScore: 0,
      tags: [],
    };

    if (currentPage === 1) {
      setTrackerData((prev) => {
        const newTotal = prev.pagination.totalJobs + 1;
        const newJobs = [newJob, ...prev.jobs];
        const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);

        return {
          ...prev,
          jobs: newJobs.slice(0, ITEMS_PER_PAGE),
          pagination: {
            totalJobs: newTotal,
            currentPage: 1,
            itemsPerPage: ITEMS_PER_PAGE,
            totalPages: newTotalPages,
          },
        };
      });
    } else {
      void fetchTrackerData(currentPage);
    }
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

    const updatedJob: Job = {
      ...jobToSave,
      postedDate: format(new Date(), "dd.MM.yyyy"),
      isModifying: false,
    };

    try {
      if (jobToSave.id < 0) {
        const response = await addJob(updatedJob);
        if (currentPage === 1) {
          setTrackerData((prev) => {
            const newTotal = prev.pagination.totalJobs + 1;
            const newJobs = [response.job, ...prev.jobs];
            const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);

            return {
              ...prev,
              jobs: newJobs.slice(0, ITEMS_PER_PAGE),
              pagination: {
                totalJobs: newTotal,
                currentPage: 1,
                itemsPerPage: ITEMS_PER_PAGE,
                totalPages: newTotalPages,
              },
            };
          });
        } else {
          void fetchTrackerData(currentPage);
        }
      } else {
        const response = await updateJob(id, updatedJob);
        setTrackerData((prev) => ({
          ...prev,
          jobs: prev.jobs.map((job) => (job.id === id ? response.job : job)),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelModifyJob = (id: number): void => {
    setTrackerData((prev) => {
      const isNewUnsavedJob = prev.jobs.find((job) => job.id === id && job.isModifying && !job.company && !job.title);

      if (!isNewUnsavedJob) {
        return {
          ...prev,
          jobs: prev.jobs.map((job) => (job.id === id ? { ...job, isModifying: false } : job)),
        };
      }

      const updatedJobs = prev.jobs.filter((job) => job.id !== id);
      const newTotalJobs = prev.pagination.totalJobs - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotalJobs / ITEMS_PER_PAGE));

      return {
        ...prev,
        jobs: updatedJobs,
        pagination: {
          ...prev.pagination,
          totalJobs: newTotalJobs,
          totalPages: newTotalPages,
        },
      };
    });
  };

  const startScrape = async (): Promise<ScrapeResponse> => {
    const response: Response = await fetch(`${BASE_URL}/api/scrape`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to start scrape");
    }
    return (await response.json()) as ScrapeResponse;
  };

  const cancelScrape = async (): Promise<CancelScrapeResponse> => {
    const response: Response = await fetch(`${BASE_URL}/api/scrape/cancel`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to cancel scrape");
    }
    return (await response.json()) as CancelScrapeResponse;
  };

  const handleScrape = (): void => {
    if (trackerData.scrapeInfo.scraping) {
      void (async () => {
        try {
          await cancelScrape();
        } catch (err) {
          console.error(err);
        }
      })();
    } else {
      void (async () => {
        try {
          await startScrape();
        } catch (err) {
          console.error(err);
        }
      })();
    }
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
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
          <span>Tracker</span>
          <div className="flex items-center gap-4 text-base">
            <div className="flex items-center gap-2">
              <HeartPulse
                className={`w-6 h-6 ${trackerData.health.isHealthy ? "text-green-500 animate-pulse" : "text-red-500"}`}
              />
              <span className={`${trackerData.health.isHealthy ? "text-green-600" : "text-red-600"} font-medium`}>
                {trackerData.health.isHealthy ? "Healthy" : "Unhealthy"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant={trackerData.scrapeInfo.scraping ? "destructive" : "default"} onClick={handleScrape}>
                {trackerData.scrapeInfo.scraping ? "Cancel Scrape" : "Scrape"}
              </Button>
              {trackerData.scrapeInfo.scraping && (
                <div className="flex items-center gap-3 w-[220px]">
                  <Progress className="w-full" value={trackerData.scrapeInfo.scrapeProgress} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {trackerData.scrapeInfo.estimatedSeconds}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <JobToolbar
          sortBy="date"
          setSortBy={() => {}}
          groupByCompany={false}
          setGroupByCompany={() => {}}
          showArchived={false}
          setShowArchived={() => {}}
          showPriorityOnly={false}
          setShowPriorityOnly={() => {}}
          onAddNewJob={handleAddNewJob}
        />

        <JobTable
          jobs={trackerData.jobs}
          currentPage={trackerData.pagination.currentPage}
          itemsPerPage={trackerData.pagination.itemsPerPage}
          setTotalJobs={() => {}}
          onUpdateJob={handleUpdateJob}
          onSaveJob={(id) => { void handleSaveJob(id); }}
          onCancelModifyJob={handleCancelModifyJob}
        />

        <PaginationControls
          currentPage={trackerData.pagination.currentPage}
          totalPages={trackerData.pagination.totalPages}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
        />

        <ChartsSection statusCounts={trackerData.statusCounts} />
      </div>
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
