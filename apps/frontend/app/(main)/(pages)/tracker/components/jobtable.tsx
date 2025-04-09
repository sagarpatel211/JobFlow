"use client";
import React, { useEffect } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobTableProps } from "@/types/job";
import { JobRow } from "./jobrow";
import { ModifyJobRow } from "./modifyjob";
import { statuses } from "@/lib/constants";

export function JobTable({
  jobs,
  currentPage,
  itemsPerPage,
  setTotalJobs,
  onUpdateJob,
  onSaveJob,
  onCancelModifyJob,
  onArchiveJob,
  onDeleteJob,
  onTogglePriorityJob,
}: JobTableProps) {
  useEffect(() => {
    setTotalJobs(jobs.length);
  }, [jobs, setTotalJobs]);

  const updateStatus = (jobId: number, direction: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    let newIndex = job.statusIndex + direction;
    newIndex = Math.max(0, Math.min(statuses.length - 1, newIndex));
    onUpdateJob(jobId, { statusIndex: newIndex });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${API_URL}/api/jobs/${String(jobId)}/status-arrow`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update status");
        }
      })
      .catch((error: unknown) => {
        console.error("Error updating job status:", error);
        onUpdateJob(jobId, { statusIndex: job.statusIndex });
      });
  };

  const togglePriority = (jobId: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    if (onTogglePriorityJob) {
      onTogglePriorityJob(jobId);
    } else {
      onUpdateJob(jobId, { priority: !job.priority });
    }
  };

  const handleModifyJob = (jobId: number) => {
    onUpdateJob(jobId, { isModifying: true });
  };

  return (
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
        {jobs.map((job) => {
          if (job.isModifying) {
            return (
              <ModifyJobRow
                key={job.id}
                job={job}
                onUpdateJob={onUpdateJob}
                onSaveJob={onSaveJob}
                onCancelModifyJob={onCancelModifyJob}
                updateStatus={updateStatus}
              />
            );
          }
          return (
            <JobRow
              key={job.id}
              job={job}
              updateStatus={updateStatus}
              togglePriority={togglePriority}
              onModifyJob={handleModifyJob}
              onArchiveJob={onArchiveJob}
              onDeleteJob={onDeleteJob}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}
