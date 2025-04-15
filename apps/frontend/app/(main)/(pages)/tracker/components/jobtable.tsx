"use client";
import React, { useEffect, useCallback } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobTableProps } from "@/types/job";
import { JobRow } from "./jobrow";
import { ModifyJobRow } from "./modifyjob";
import { useUpdateJobStatus } from "../hooks/useUpdateJobStatus";

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
  onFocusJob,
}: JobTableProps) {
  useEffect(() => {
    setTotalJobs(jobs.length);
  }, [jobs, setTotalJobs]);

  const updateStatus = useUpdateJobStatus(jobs, onUpdateJob, onUpdateJobStatusArrow);

  const togglePriority = useCallback(
    (jobId: number) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      if (onTogglePriorityJob) {
        onTogglePriorityJob(jobId);
      } else {
        onUpdateJob(jobId, { priority: !job.priority });
      }
    },
    [jobs, onTogglePriorityJob, onUpdateJob],
  );

  const handleModifyJob = useCallback(
    (jobId: number) => {
      onUpdateJob(jobId, { isModifying: true });
    },
    [onUpdateJob],
  );

  const currentCompanyName = groupByCompany && jobs.length > 0 ? jobs[0].company : null;

  // Add event handlers to focus jobs
  const handleFocusJob = (id: number) => {
    if (onFocusJob) {
      onFocusJob(id);
    }
  };

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
          {jobs.map((job) =>
            job.isModifying ? (
              <ModifyJobRow
                key={job.id}
                job={job}
                onUpdateJob={onUpdateJob}
                onSaveJob={onSaveJob}
                onCancelModifyJob={onCancelModifyJob}
                updateStatus={updateStatus}
              />
            ) : (
              <JobRow
                key={job.id}
                job={job}
                updateStatus={updateStatus}
                togglePriority={togglePriority}
                onModifyJob={handleModifyJob}
                onArchiveJob={onArchiveJob}
                onDeleteJob={onDeleteJob}
                onFocus={handleFocusJob}
              />
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
