import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { TableRow, TableCell } from "@/components/ui/table";
import { parse, format } from "date-fns";
import { JobRowProps } from "@/types/job";
import { StatusBadge } from "./statusbadge";
import { JobActions } from "./jobactions";
import { Archive, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function JobRow({ job, updateStatus, togglePriority, onModifyJob, onArchiveJob, onDeleteJob }: JobRowProps) {
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
      <TableCell className="flex items-center gap-40">
        <StatusBadge
          statusIndex={job.statusIndex}
          onDecreaseStatus={decreaseStatus}
          onIncreaseStatus={increaseStatus}
        />
        <Link
          href="/fill-with-ai"
          className="group relative inline-flex h-8 overflow-hidden rounded-md p-[2px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] group-hover:animate-[spin_2s_linear_reverse_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#B0D0FF_0%,#1E3A8A_50%,#B0D0FF_100%)] group-hover:bg-[conic-gradient(from_90deg_at_50%_50%,#A0C4FF_0%,#162D70_50%,#A0C4FF_100%)] transition-[background] duration-3000 ease-in-out" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-md bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            Fill with AI
          </span>
        </Link>
      </TableCell>
      <TableCell className="pr-2">
        <JobActions
          priority={job.priority}
          onTogglePriority={() => {
            togglePriority(job.id);
          }}
          onModify={() => {
            if (onModifyJob) onModifyJob(job.id);
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
