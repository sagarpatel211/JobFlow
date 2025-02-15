"use client";

import { JobTable } from "@/app/(main)/(pages)/tracker/components/jobtable";
import { useState } from "react";
import { format } from "date-fns";
import PaginationControls from "@/app/(main)/(pages)/tracker/components/pagination";
import JobToolbar from "@/app/(main)/(pages)/tracker/components/jobtoolbar";
import { Job } from "@/types/job";

const ITEMS_PER_PAGE = 5;

const initialJobs: Job[] = [
  {
    id: 1,
    company: "Google",
    title: "Software Engineer",
    link: "https://www.google.com/fddfkdfjdjfkdfjkdfjkdfkjdfkjfdkjdfkjfdkjfdkjdfkjdfdkfjfddfkdfjdjfkdfjkdfjkdfkjdfkjfdkjdfkjfdkjfdkjdfkjdfdkfj",
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

const TrackerPage = () => {
  const [sortBy, setSortBy] = useState("date");
  const [groupByCompany, setGroupByCompany] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobs, setJobs] = useState(initialJobs);

  const totalPages = Math.ceil(totalJobs / ITEMS_PER_PAGE);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

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

  return (
    <div className="flex flex-col gap-4 relative">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
        Tracker (DO THESE https://chatgpt.com/c/67aff962-9138-8011-899e-158f73e29f84 hover row to add labels, and track
        application)
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
    </div>
  );
};

export default TrackerPage;
