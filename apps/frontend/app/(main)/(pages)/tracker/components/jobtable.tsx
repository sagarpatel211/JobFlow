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
  onUpdateJobStatusArrow,
  statusCounts,
  groupByCompany = false,
}: JobTableProps) {
  useEffect(() => {
    setTotalJobs(jobs.length);
  }, [jobs, setTotalJobs]);

  // Helper function to update status counts locally
  const updateStatusCountsLocally = (oldStatus: string, newStatus: string) => {
    // Create a copy of the current status counts
    const updatedCounts = { ...statusCounts };

    // Decrement the old status count
    if (oldStatus && updatedCounts[oldStatus] > 0) {
      updatedCounts[oldStatus] -= 1;
    }

    // Increment the new status count
    if (newStatus) {
      updatedCounts[newStatus] = (updatedCounts[newStatus] || 0) + 1;
    }

    // Dispatch event with updated counts
    window.dispatchEvent(
      new CustomEvent("statusCountsUpdated", {
        detail: updatedCounts,
      }),
    );
  };

  const updateStatus = (jobId: number, direction: number) => {
    // If we have the parent handler, use it
    if (onUpdateJobStatusArrow) {
      onUpdateJobStatusArrow(jobId, direction);
      return;
    }

    // Otherwise, fall back to the old approach
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // Store the old status before updating
    const oldStatusIndex = job.statusIndex;
    const oldStatus = getStatusFromIndex(oldStatusIndex);

    // Calculate the new status index
    let newIndex = job.statusIndex + direction;
    newIndex = Math.max(0, Math.min(statuses.length - 1, newIndex));
    const newStatus = getStatusFromIndex(newIndex);

    // Update the UI immediately
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
        return response.json();
      })
      .then((data) => {
        // Instead of fetching status counts from the server,
        // calculate and update them locally
        updateStatusCountsLocally(oldStatus, newStatus);
      })
      .catch((error: unknown) => {
        console.error("Error updating job status:", error);
        // Revert the UI change on error
        onUpdateJob(jobId, { statusIndex: oldStatusIndex });
      });
  };

  // Helper function to convert status index to status string
  const getStatusFromIndex = (statusIndex: number): string => {
    const statusValues = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
    return statusIndex >= 0 && statusIndex < statusValues.length ? statusValues[statusIndex] : "nothing_done";
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

  // Get company name for the current view (when groupByCompany is true)
  const currentCompanyName = groupByCompany && jobs.length > 0 ? jobs[0].company : null;

  return (
    <div className="flex flex-col gap-2">
      {groupByCompany && currentCompanyName && (
        <div className="py-2 px-4 bg-muted/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{currentCompanyName}</h3>
            <span className="text-sm text-muted-foreground">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

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
    </div>
  );
}
