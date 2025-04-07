// File: tracker/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
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
const defaultTrackerData = {
  jobs: [] as Job[],
  statusCounts: { nothingDone: 0, applying: 0, applied: 0, OA: 0, interview: 0, offer: 0, rejected: 0 },
  pagination: { totalJobs: 0, currentPage: 1, itemsPerPage: 4, totalPages: 1 },
  scrapeInfo: { scraping: false, scrapeProgress: 0, estimatedSeconds: 0 },
  health: { isHealthy: false }
};
export default function TrackerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const createQueryString = useMemo(() => {
    return (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    };
  }, [searchParams]);
  const [currentPage, setCurrentPage] = useState<number>(
    searchParams.get("page") ? parseInt(searchParams.get("page") as string, 10) : 1
  );
  const [trackerData, setTrackerData] = useState(defaultTrackerData);
  const [localJobs, setLocalJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tracker?page=${currentPage}`);
      if (!res.ok) throw new Error("Failed to fetch tracker data");
      const data = await res.json();
      setTrackerData(data.trackerData);
      setLocalJobs(data.trackerData.jobs);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Using cached or initial data.");
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchTrackerData();
  }, [currentPage]);
  const addJob = async (job: Job) => {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job })
    });
    if (!res.ok) throw new Error("Failed to add job");
    return res.json();
  };
  const updateJob = async (id: number, job: Job) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job })
    });
    if (!res.ok) throw new Error("Failed to update job");
    return res.json();
  };
  const handleAddNewJob = () => {
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
      tags: []
    };
    setLocalJobs((prev) => [newJob, ...prev]);
  };
  const handleUpdateJob = (id: number, updatedFields: Partial<Job>) => {
    setLocalJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updatedFields } : job))
    );
  };
  const handleSaveJob = async (id: number) => {
    const jobToSave = localJobs.find((job) => job.id === id);
    if (!jobToSave) return;
    const updatedJob = {
      ...jobToSave,
      postedDate: format(new Date(), "dd.MM.yyyy"),
      isModifying: false
    };
    try {
      if (jobToSave.id < 0) {
        await addJob(updatedJob);
      } else {
        await updateJob(id, updatedJob);
      }
      fetchTrackerData();
    } catch (err) {
      console.error(err);
    }
  };
  const handleCancelModifyJob = (id: number) => {
    const job = localJobs.find((job) => job.id === id);
    if (job && job.isModifying && !job.company && !job.title) {
      setLocalJobs((prev) => prev.filter((job) => job.id !== id));
    } else {
      fetchTrackerData();
    }
  };
  const goToNextPage = () => {
    if (trackerData.pagination && currentPage < trackerData.pagination.totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      router.push(`/tracker?${createQueryString("page", nextPage.toString())}`, { scroll: false });
    }
  };
  const goToPrevPage = () => {
    if (trackerData.pagination && currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      router.push(`/tracker?${createQueryString("page", prevPage.toString())}`, { scroll: false });
    }
  };
  const startScrape = async () => {
    const res = await fetch("/api/scrape", { method: "POST" });
    if (!res.ok) throw new Error("Failed to start scrape");
    return res.json();
  };
  const cancelScrape = async () => {
    const res = await fetch("/api/scrape/cancel", { method: "POST" });
    if (!res.ok) throw new Error("Failed to cancel scrape");
    return res.json();
  };
  const handleScrape = async () => {
    try {
      if (trackerData.scrapeInfo.scraping) {
        await cancelScrape();
      } else {
        await startScrape();
      }
      fetchTrackerData();
    } catch (err) {
      console.error(err);
    }
  };
  if (loading) {
    return <LoadingSkeleton />;
  }
  const { statusCounts, pagination, scrapeInfo, health } = trackerData;
  return (
    <div className="p-4">
      {error && (
        <div className={`px-4 py-3 rounded mb-4 ${isDark ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-100 border border-red-400 text-red-700"}`} role="alert">
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
            border: isDark ? "1px solid #333" : "1px solid #ddd"
          }
        }}
      />
      <div className="flex flex-col gap-4">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
          <span>Tracker</span>
          <div className="flex items-center gap-4 text-base">
            <div className="flex items-center gap-2">
              <HeartPulse className={`w-6 h-6 ${health?.isHealthy ? "text-green-500 animate-pulse" : "text-red-500"}`} />
              <span className={`${health?.isHealthy ? "text-green-600" : "text-red-600"} font-medium`}>
                {health?.isHealthy ? "Healthy" : "Unhealthy"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant={scrapeInfo?.scraping ? "destructive" : "default"} onClick={handleScrape}>
                {scrapeInfo?.scraping ? "Cancel Scrape" : "Scrape"}
              </Button>
              {scrapeInfo?.scraping && (
                <div className="flex items-center gap-3 w-[220px]">
                  <Progress className="w-full" value={scrapeInfo.scrapeProgress} />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {scrapeInfo.estimatedSeconds}s
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
          jobs={localJobs}
          currentPage={pagination?.currentPage ?? currentPage}
          itemsPerPage={pagination?.itemsPerPage ?? 4}
          setTotalJobs={() => {}}
          onUpdateJob={handleUpdateJob}
          onSaveJob={handleSaveJob}
          onCancelModifyJob={handleCancelModifyJob}
        />
        <PaginationControls
          currentPage={pagination?.currentPage ?? currentPage}
          totalPages={pagination?.totalPages ?? 1}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
        />
        <ChartsSection statusCounts={statusCounts} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
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
