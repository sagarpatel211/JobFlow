"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useQuery, useMutation } from "@apollo/client";
import { useApollo } from "@/lib/apolloClient";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { JobTable } from "./jobtable";
import PaginationControls from "./pagination";
import JobToolbar from "./jobtoolbar";
import { ChartsSection } from "./chartsection";
import {
  GET_TRACKER_DATA,
  ADD_JOB,
  UPDATE_JOB,
  START_SCRAPE,
  CANCEL_SCRAPE,
} from "@/lib/graphql";
import { TrackerData } from "@/types/tracker";
import { Job } from "@/types/job";
import { HeartPulse } from "lucide-react";

interface TrackerClientProps {
  initialData: any;
  initialPage: number;
}

export default function TrackerClient({ initialData, initialPage }: TrackerClientProps) {
  const client = useApollo(initialData);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Create a memoized function to update the URL
  const createQueryString = useMemo(() => {
    return (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    };
  }, [searchParams]);

  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const { data, loading, error, refetch } = useQuery<{ trackerData: TrackerData }>(GET_TRACKER_DATA, {
    variables: { page: currentPage },
    client,
    pollInterval: 60000,
    // Add error handling and fetch policy
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    onError: (error) => console.error("GraphQL query error:", error)
  });

  // Handle error properly
  useEffect(() => {
    if (error) {
      console.error("Error fetching tracker data:", error);
    }
  }, [error]);

  // Use the initialData directly to prevent null issues
  const trackerData = useMemo<TrackerData>(() => {
    return data?.trackerData || initialData?.trackerData || {
      jobs: [],
      statusCounts: { nothingDone: 0, applying: 0, applied: 0, OA: 0, interview: 0, offer: 0, rejected: 0 },
      pagination: { totalJobs: 0, currentPage: initialPage, itemsPerPage: 4, totalPages: 1 },
      scrapeInfo: { scraping: false, scrapeProgress: 0, estimatedSeconds: 0 },
      health: { isHealthy: false },
    };
  }, [data, initialData, initialPage]);

  const [localJobs, setLocalJobs] = useState<Job[]>(trackerData.jobs);

  // Update local jobs when tracker data changes
  useEffect(() => {
    if (trackerData?.jobs) {
      setLocalJobs(trackerData.jobs);
    }
  }, [trackerData.jobs]);

  const [addJobMutation] = useMutation<{ addJob: Job }>(ADD_JOB, { client });
  const [updateJobMutation] = useMutation<
    { updateJob: Job },
    { id: string; jobInput: Partial<Job> }
  >(UPDATE_JOB, { client });
  const [startScrapeMutation] = useMutation(START_SCRAPE, { client });
  const [cancelScrapeMutation] = useMutation(CANCEL_SCRAPE, { client });

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
      tags: [],
    };
    setLocalJobs((prev) => [newJob, ...prev]);
  };

  const handleUpdateJob = (id: number, updatedFields: Partial<Job>) => {
    setLocalJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updatedFields } : job)));
  };

  const handleSaveJob = async (id: number) => {
    const jobToSave = localJobs.find((job) => job.id === id);
    if (!jobToSave) return;
    const updatedJob: Job = {
      ...jobToSave,
      postedDate: format(new Date(), "dd.MM.yyyy"),
      isModifying: false,
    };
    try {
      if (jobToSave.id < 0) {
        await addJobMutation({ variables: { jobInput: updatedJob } });
      } else {
        await updateJobMutation({ variables: { id: String(id), jobInput: updatedJob } });
      }
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelModifyJob = (id: number) => {
    const job = localJobs.find((job) => job.id === id);
    if (job && job.isModifying && !job.company && !job.title) {
      setLocalJobs((prev) => prev.filter((job) => job.id !== id));
    } else {
      refetch();
    }
  };

  const goToNextPage = () => {
    if (trackerData.pagination && currentPage < trackerData.pagination.totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      router.push(`/tracker?${createQueryString('page', nextPage.toString())}`, { scroll: false });
    }
  };

  const goToPrevPage = () => {
    if (trackerData.pagination && currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      router.push(`/tracker?${createQueryString('page', prevPage.toString())}`, { scroll: false });
    }
  };

  const handleScrape = async () => {
    if (trackerData.scrapeInfo.scraping) {
      await cancelScrapeMutation();
    } else {
      await startScrapeMutation();
    }
    await refetch();
  };

  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (loading) return <p>Loading...</p>;

  const { statusCounts, pagination, scrapeInfo, health } = trackerData;

  return (
    <>
      {/* Show error message if needed */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>Failed to fetch data. Using cached or initial data.</p>
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
      <div className="flex flex-col gap-4 relative">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
          <span>Tracker</span>
          <div className="flex items-center gap-4 text-base">
            <div className="flex items-center gap-2">
              <HeartPulse
                className={`w-6 h-6 ${health?.isHealthy ? "text-green-500 animate-pulse" : "text-red-500"
                  }`}
              />
              <span
                className={`${health?.isHealthy ? "text-green-600" : "text-red-600"
                  } font-medium`}
              >
                {health?.isHealthy ? "Healthy" : "Unhealthy"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={scrapeInfo?.scraping ? "destructive" : "default"}
                onClick={handleScrape}
              >
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
        </h1>
        <JobToolbar
          sortBy="date"
          setSortBy={() => { }}
          groupByCompany={false}
          setGroupByCompany={() => { }}
          showArchived={false}
          setShowArchived={() => { }}
          showPriorityOnly={false}
          setShowPriorityOnly={() => { }}
          onAddNewJob={handleAddNewJob}
        />
        <div className="mx-4">
          <JobTable
            jobs={localJobs}
            currentPage={pagination?.currentPage ?? currentPage}
            itemsPerPage={pagination?.itemsPerPage ?? 4}
            setTotalJobs={() => { }}
            onUpdateJob={handleUpdateJob}
            onSaveJob={handleSaveJob}
            onCancelModifyJob={handleCancelModifyJob}
          />
        </div>
        <PaginationControls
          currentPage={pagination?.currentPage ?? currentPage}
          totalPages={pagination?.totalPages ?? 1}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
        />
        <ChartsSection
          statusCounts={
            statusCounts ?? {
              nothingDone: 0,
              applying: 0,
              applied: 0,
              OA: 0,
              interview: 0,
              offer: 0,
              rejected: 0,
            }
          }
        />
      </div>
    </>
  );
}
