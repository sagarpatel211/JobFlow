"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { statuses, statusColors } from "@/lib/constants";
import { StatusBadgeProps } from "@/types/statusbadge";

export function StatusBadge({ statusIndex, onDecreaseStatus, onIncreaseStatus }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onDecreaseStatus}
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
        onClick={onIncreaseStatus}
        disabled={statusIndex === statuses.length - 1}
        className="disabled:opacity-50"
        title="Increase status"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
