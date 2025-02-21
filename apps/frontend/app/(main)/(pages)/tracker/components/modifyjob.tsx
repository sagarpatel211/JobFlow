import React from "react";
import { parse, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { ModifyJobRowProps } from "@/types/job";
import { statuses, statusColors } from "@/lib/constants";

export function ModifyJobRow({ job, onUpdateJob, onSaveJob, onCancelModifyJob, updateStatus }: ModifyJobRowProps) {
  const isSaveDisabled = !job.company || !job.title || !job.postedDate || !job.link;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-row gap-2 -mr-48">
          <Input
            name="company"
            placeholder="Company"
            value={job.company}
            onChange={(e) => {
              onUpdateJob(job.id, { company: e.target.value });
            }}
            className="w-24"
          />
          <Input
            name="title"
            placeholder="Job Title"
            value={job.title}
            onChange={(e) => {
              onUpdateJob(job.id, { title: e.target.value });
            }}
            className="w-40"
          />
        </div>
      </TableCell>

      <TableCell>
        <Input
          type="date"
          name="postedDate"
          className="w-40 -mr-14"
          value={
            job.postedDate
              ? format(parse(job.postedDate, "dd.MM.yyyy", new Date()), "yyyy-MM-dd")
              : format(new Date(), "yyyy-MM-dd")
          }
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            onUpdateJob(job.id, {
              postedDate: format(newDate, "dd.MM.yyyy"),
            });
          }}
        />
      </TableCell>

      <TableCell>
        <Input
          name="link"
          placeholder="Job Link"
          value={job.link || ""}
          onChange={(e) => {
            onUpdateJob(job.id, { link: e.target.value });
          }}
          className="w-60"
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              updateStatus(job.id, -1);
            }}
            disabled={job.statusIndex === 0}
            className="disabled:opacity-50"
            title="Decrease status"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs min-w-[100px] text-center justify-center ${statusColors[job.statusIndex]}`}
          >
            {statuses[job.statusIndex]}
          </span>
          <button
            onClick={() => {
              updateStatus(job.id, 1);
            }}
            disabled={job.statusIndex === statuses.length - 1}
            className="disabled:opacity-50"
            title="Increase status"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex gap-2">
          <button
            className="text-blue-500"
            onClick={() => {
              onCancelModifyJob(job.id);
            }}
          >
            Cancel
          </button>
          <button
            className={`text-green-500 ${isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => {
              onSaveJob(job.id);
            }}
            disabled={isSaveDisabled}
          >
            Save
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
