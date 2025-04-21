"use client";
import React, { useEffect, useCallback } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobRow } from "./jobrow";
import { ModifyJobRow } from "./modifyjob";
import { useUpdateJobStatus } from "../hooks/useUpdateJobStatus";
import { JobTableProps } from "@/types/job";

export function JobTable({
  jobs = [],
  setTotalJobs,
  onUpdateJob,
  onSaveJob,
  onCancelModifyJob,
  onArchiveJob,
  onDeleteJob,
  onTogglePriorityJob,
  onUpdateJobStatusArrow,
  groupByCompany = false,
  onFocusJob,
  isJobProcessing,
}: JobTableProps) {
  useEffect(() => {
    setTotalJobs(jobs.length);
  }, [jobs, setTotalJobs]);

  const updateStatusWithPromise = useUpdateJobStatus(jobs, onUpdateJob, onUpdateJobStatusArrow);

  // Wrap the Promise-returning function with a void function
  const updateStatus = useCallback(
    (...args: Parameters<typeof updateStatusWithPromise>) => {
      void updateStatusWithPromise(...args);
    },
    [updateStatusWithPromise],
  );

  const togglePriority = useCallback(
    (id: number) => {
      const target = jobs.find((j) => j.id === id);
      if (!target) return;
      if (onTogglePriorityJob) onTogglePriorityJob(id);
      else onUpdateJob(id, { priority: !target.priority });
    },
    [jobs, onTogglePriorityJob, onUpdateJob],
  );

  const handleModify = useCallback((id: number) => onUpdateJob(id, { isModifying: true }), [onUpdateJob]);

  const currentCompanyName = groupByCompany && jobs.length ? jobs[0].company : null;

  const handleFocusJob = (id: number) => onFocusJob?.(id);

  return (
    <div className="flex flex-col gap-2">
      {groupByCompany && currentCompanyName && (
        <div className="py-2 px-4 bg-muted/30 rounded-lg flex items-center gap-2">
          <h3 className="text-lg font-semibold">{currentCompanyName}</h3>
          <span className="text-sm text-muted-foreground">
            {jobs.length} job{jobs.length !== 1 && "s"}
          </span>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
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
                onModifyJob={handleModify}
                onArchiveJob={onArchiveJob}
                onDeleteJob={onDeleteJob}
                onFocus={handleFocusJob}
                onUpdateJob={onUpdateJob}
                isBeingProcessed={isJobProcessing?.(job.id) || false}
              />
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
