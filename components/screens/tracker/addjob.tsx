import React, { useState } from "react";
import { parse, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { statuses, statusColors } from "@/lib/constants";
import { AddJobProps } from "@/types/job";

export function AddJob({ onAddJob, onCancelAdd }: AddJobProps) {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [postedDate, setPostedDate] = useState(format(new Date(), "dd.MM.yyyy"));
  const [link, setLink] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);

  const isSaveDisabled = !company || !title || !postedDate || !link;

  const updateStatus = (direction: number) => {
    let newIndex = statusIndex + direction;
    newIndex = Math.max(0, Math.min(statuses.length - 1, newIndex));
    setStatusIndex(newIndex);
  };

  const handleSave = () => {
    if (isSaveDisabled) return;
    onAddJob({ company, title, postedDate, link, statusIndex, priority: false });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-row gap-2 -mr-48">
          <Input
            name="company"
            placeholder="Company Name"
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
            }}
            className="w-36"
          />
          <Input
            name="title"
            placeholder="Job Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            className="w-52"
          />
        </div>
      </TableCell>

      <TableCell>
        <Input
          type="date"
          name="postedDate"
          className="w-40 -mr-14"
          value={format(parse(postedDate, "dd.MM.yyyy", new Date()), "yyyy-MM-dd")}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            setPostedDate(format(newDate, "dd.MM.yyyy"));
          }}
        />
      </TableCell>

      <TableCell>
        <Input
          name="link"
          placeholder="Job Link"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
          }}
          className="w-60"
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              updateStatus(-1);
            }}
            disabled={statusIndex === 0}
            className="disabled:opacity-50"
            title="Decrease status"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs min-w-[100px] text-center justify-center ${statusColors[statusIndex]}`}
          >
            {statuses[statusIndex]}
          </span>
          <button
            onClick={() => {
              updateStatus(1);
            }}
            disabled={statusIndex === statuses.length - 1}
            className="disabled:opacity-50"
            title="Increase status"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex gap-2">
          <button className="text-blue-500" onClick={onCancelAdd}>
            Cancel
          </button>
          <button
            className={`text-green-500 ${isSaveDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            Save
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
