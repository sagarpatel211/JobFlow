"use client";
import React, { useEffect, useState } from "react";
import { format, isValid } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { ModifyJobRowProps, JobStatus } from "@/types/job";
import { statuses, statusColors } from "@/lib/constants";

// Map UI status strings to backend JobStatus values
const statusMapping: Record<number, JobStatus> = {
  0: "nothing_done",
  1: "applying",
  2: "applied",
  3: "OA",
  4: "interview",
  5: "offer",
  6: "rejected",
};

/**
 * Converts from dd.MM.yyyy to yyyy-MM-dd (HTML date input format)
 */
function toInputDateFormat(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";

  try {
    // Handle dd.MM.yyyy format
    if (dateStr.includes(".")) {
      const [day, month, year] = dateStr.split(".").map(Number);
      const parsed = new Date(year, month - 1, day);
      if (isValid(parsed)) {
        return format(parsed, "yyyy-MM-dd");
      }
    }

    // Try to parse as ISO date
    const parsed = new Date(dateStr);
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  } catch (e) {
    console.error("Date parsing error:", e);
  }

  return "";
}

/**
 * Converts from yyyy-MM-dd (HTML date input) to dd.MM.yyyy (backend format)
 */
function toBackendDateFormat(dateStr: string): string {
  if (!dateStr) return "";

  try {
    // Parse the yyyy-MM-dd format
    const [year, month, day] = dateStr.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (isValid(parsed)) {
      return format(parsed, "dd.MM.yyyy");
    }
  } catch (e) {
    console.error("Date formatting error:", e);
  }

  return "";
}

export function ModifyJobRow({ job, onUpdateJob, onSaveJob, onCancelModifyJob, updateStatus }: ModifyJobRowProps) {
  const isSaveDisabled = !job.company || !job.title || !job.postedDate || !job.link;

  // Keep track of the date input value separately
  const [dateInputValue, setDateInputValue] = useState(toInputDateFormat(job.postedDate));

  // Update the date input when job.postedDate changes externally
  useEffect(() => {
    setDateInputValue(toInputDateFormat(job.postedDate));
  }, [job.postedDate]);

  // Handle date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const htmlDateValue = e.target.value; // yyyy-MM-dd
    setDateInputValue(htmlDateValue);

    if (htmlDateValue) {
      const backendDateValue = toBackendDateFormat(htmlDateValue); // dd.MM.yyyy

      if (backendDateValue) {
        onUpdateJob(job.id, { postedDate: backendDateValue });
      }
    }
  };

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
          value={dateInputValue}
          onChange={handleDateChange}
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
              const newIndex = Math.max(0, job.statusIndex - 1);
              onUpdateJob(job.id, {
                statusIndex: newIndex,
                status: statusMapping[newIndex],
              });
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
              const newIndex = Math.min(statuses.length - 1, job.statusIndex + 1);
              onUpdateJob(job.id, {
                statusIndex: newIndex,
                status: statusMapping[newIndex],
              });
            }}
            disabled={job.statusIndex === statuses.length - 1}
            className="disabled:opacity-50"
            title="Increase status"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </TableCell>
      <TableCell></TableCell>
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
