import React, { useEffect } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobTableProps } from "@/types/job";
import { JobRow } from "./jobrow";
import { EditJobRow } from "./editjob";
import { statuses } from "@/lib/constants";

export function JobTable({
  jobs,
  currentPage,
  itemsPerPage,
  setTotalJobs,
  onUpdateJob,
  onSaveJob,
  onCancelEditJob,
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
  };

  const togglePriority = (jobId: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    onUpdateJob(jobId, { priority: !job.priority });
  };

  const handleEditJob = (jobId: number) => {
    onUpdateJob(jobId, { isEditing: true });
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = jobs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Table>
      <TableHeader>
        <TableRow className="text-left">
          <TableHead>Company &amp; Job Title</TableHead>
          <TableHead>Posted Date</TableHead>
          <TableHead>Link</TableHead>
          <TableHead>Application Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {paginatedJobs.map((job) => {
          if (job.isEditing) {
            return (
              <EditJobRow
                key={job.id}
                job={job}
                onUpdateJob={onUpdateJob}
                onSaveJob={onSaveJob}
                onCancelEditJob={onCancelEditJob}
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
              onEditJob={handleEditJob}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}
