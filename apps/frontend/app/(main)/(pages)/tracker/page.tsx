"use client";
import { JobTable } from "@/app/(main)/(pages)/tracker/components/jobtable";
import { useState } from "react";
import { format } from "date-fns";
import PaginationControls from "@/app/(main)/(pages)/tracker/components/pagination";
import JobToolbar from "@/app/(main)/(pages)/tracker/components/jobtoolbar";
import { Job } from "@/types/job";
import { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { ChartsSection } from "./components/chartsection";

const ITEMS_PER_PAGE = 4;

const initialJobs: Job[] = [
  {
    id: 1,
    company: "Google",
    title: "Softwarsdse Engineer but super long like hiiiiiii hello",
    link: "https://www.jotform.com/build/250508845087261?s=templates",
    postedDate: "01.02.2024",
    statusIndex: 2,
    followers: "5M+ Followers",
    priority: false,
    isModifying: false,
    archived: false,
    deleted: false,
  },
  {
    id: 2,
    company: "Microsoft",
    title: "Data Analyst",
    link: "https://www.microsoft.com",
    postedDate: "15.01.2024",
    statusIndex: 3,
    followers: "3M+ Followers",
    priority: false,
    isModifying: false,
    archived: false,
    deleted: false,
  },
  {
    id: 3,
    company: "Amazon",
    title: "Backend Developer",
    link: "https://www.amazon.com",
    postedDate: "10.01.2024",
    statusIndex: 1,
    followers: "4M+ Followers",
    priority: false,
    isModifying: false,
    archived: false,
    deleted: false,
  },
  {
    id: 4,
    company: "Amazon",
    title: "Backend Developer",
    link: "https://www.amazon.com",
    postedDate: "10.01.2024",
    statusIndex: 1,
    followers: "4M+ Followers",
    priority: false,
    isModifying: false,
    archived: false,
    deleted: false,
  },
  {
    id: 5,
    company: "Amazon",
    title: "Backend Developer",
    link: "https://www.amazon.com",
    postedDate: "10.01.2024",
    statusIndex: 1,
    followers: "4M+ Followers",
    priority: false,
    isModifying: false,
    archived: false,
    deleted: false,
  },
  {
    id: 6,
    company: "Amazon",
    title: "Backend Developer",
    link: "https://www.amazon.com",
    postedDate: "10.01.2024",
    statusIndex: 1,
    followers: "4M+ Followers",
    priority: false,
    isModifying: false,
    archived: false,
    deleted: false,
  },
];

const statusCounts = {
  "Nothing Done": 2,
  Applying: 3,
  Applied: 4,
  OA: 1,
  Interview: 2,
  Offer: 1,
  Rejected: 100,
};

const TrackerPage = () => {
  const [sortBy, setSortBy] = useState("date");
  const [groupByCompany, setGroupByCompany] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobs, setJobs] = useState(initialJobs);
  const { theme } = useTheme();

  const totalPages = Math.ceil(totalJobs / ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleAddNewJob = () => {
    const newJob = {
      id: Date.now(),
      company: "",
      title: "",
      link: "",
      postedDate: "",
      statusIndex: 0,
      followers: "",
      priority: false,
      isModifying: true,
      archived: false,
      deleted: false,
    };
    setJobs((prevJobs) => [newJob, ...prevJobs]);
  };

  const handleUpdateJob = (id: number, updatedFields: Partial<Job>) => {
    setJobs((prevJobs) => prevJobs.map((job) => (job.id === id ? { ...job, ...updatedFields } : job)));
  };

  const handleSaveJob = (id: number) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === id
          ? {
              ...job,
              postedDate: format(new Date(), "dd.MM.yyyy"),
              isModifying: false,
              followers: job.followers ?? "0 Followers",
            }
          : job,
      ),
    );
  };

  const handleCancelModifyJob = (id: number) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
  };

  const isDark = theme === "dark";

  return (
    <>
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
          Tracker
        </h1>

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

        <div className="mx-4">
          <JobTable
            jobs={jobs}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            setTotalJobs={setTotalJobs}
            onUpdateJob={handleUpdateJob}
            onSaveJob={handleSaveJob}
            onCancelModifyJob={handleCancelModifyJob}
          />
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages || 1}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
        />
        <ChartsSection statusCounts={statusCounts} />
      </div>
    </>
  );
};

export default TrackerPage;
