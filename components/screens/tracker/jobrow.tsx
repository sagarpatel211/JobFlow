import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { TableRow, TableCell } from "@/components/ui/table";
import { parse, format } from "date-fns";
import { JobRowProps } from "@/types/job";
import { StatusBadge } from "./statusbadge";
import { JobActions } from "./jobactions";
import { Archive, Star } from "lucide-react";
import Image from "next/image";

export function JobRow({ job, updateStatus, togglePriority, onEditJob, onArchiveJob, onDeleteJob }: JobRowProps) {
  const decreaseStatus = () => {
    updateStatus(job.id, -1);
  };
  const increaseStatus = () => {
    updateStatus(job.id, 1);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <Image src="/globe.svg" alt={job.company} width={24} height={24} />
          </Avatar>
          <div>
            <div className="flex items-center">
              {job.company}
              {job.priority && <Star className="ml-1 h-4 w-4 text-amber-500" />}
              {job.archived && <Archive className="ml-1 h-4 w-4 text-gray-500" />}
            </div>
            <div className="text-xs text-muted-foreground">{job.title}</div>
          </div>
        </div>
      </TableCell>

      <TableCell title={job.postedDate ? format(parse(job.postedDate, "dd.MM.yyyy", new Date()), "MMM d, yyyy") : ""}>
        {job.postedDate}
      </TableCell>

      <TableCell>
        <div className="max-w-[200px] truncate">
          <a href={job.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {job.link}
          </a>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge
          statusIndex={job.statusIndex}
          onDecreaseStatus={decreaseStatus}
          onIncreaseStatus={increaseStatus}
        />
      </TableCell>
      <TableCell className="pr-2">
        <JobActions
          priority={job.priority}
          onTogglePriority={() => {
            togglePriority(job.id);
          }}
          onEdit={() => {
            if (onEditJob) onEditJob(job.id);
          }}
          onArchive={() => {
            if (onArchiveJob) onArchiveJob(job.id);
          }}
          onDelete={() => {
            if (onDeleteJob) onDeleteJob(job.id);
          }}
        />
      </TableCell>
    </TableRow>
  );
}
