"use client";
import React from "react";
import { MoreHorizontal, Edit, Archive, Trash, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobActionsProps } from "@/types/job";

export function JobActions({ priority, archived, onTogglePriority, onModify, onArchive, onDelete, disabled }: JobActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label="Job actions menu"
          className={`p-2 text-muted-foreground hover:bg-muted-foreground/10 rounded-md ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={-10} alignOffset={5}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onTogglePriority}>
          <Star className={`mr-2 h-4 w-4 ${priority ? "text-amber-500" : "text-gray-500"}`} />
          {priority ? "Unmark Priority" : "Mark Priority"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onModify}>
          <Edit className="mr-2 h-4 w-4 text-blue-500" /> Modify
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onArchive}>
          <Archive className="mr-2 h-4 w-4 text-gray-500" /> {archived ? "Unarchive" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDelete}>
          <Trash className="mr-2 h-4 w-4 text-red-500" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
