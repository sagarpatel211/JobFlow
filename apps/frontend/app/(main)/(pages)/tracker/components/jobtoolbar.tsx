"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, List, Star, Plus, Archive, Check } from "lucide-react";
import { JobToolbarProps } from "@/types/job";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
const filterOptions = [
  { label: "Only Not Applied Jobs", color: "bg-blue-500 text-white" },
  { label: "Posted <1 week", color: "bg-green-500 text-white" },
  { label: "Internships", color: "bg-purple-500 text-white" },
  { label: "New Grad", color: "bg-orange-500 text-white" },
];

const JobToolbar = ({
  sortBy, // new prop for current sort option
  setSortBy,
  groupByCompany,
  setGroupByCompany,
  showArchived,
  setShowArchived,
  showPriorityOnly,
  setShowPriorityOnly,
  onAddNewJob,
}: JobToolbarProps) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]));
  };
  return (
    <div className="flex items-center justify-between px-4">
      <span className="flex items-center w-full max-w-md rounded-full bg-muted px-4 border-2 border-transparent focus-within:border-primary focus-within:shadow-lg transition-all">
        <Search className="text-muted-foreground" />
        <Input
          placeholder="Quick Search"
          className="w-full border-none bg-transparent outline-none focus:ring-0 focus:outline-none focus:border-transparent px-2"
        />
      </span>
      <div className="flex items-center gap-2 px-4 flex-wrap">
        {filterOptions.map(({ label, color }) => (
          <Badge
            key={label}
            onClick={() => {
              toggleFilter(label);
            }}
            className={`cursor-pointer px-3 py-1 rounded-full transition-all ${
              selectedFilters.includes(label) ? `${color} shadow-lg` : "bg-gray-200 text-gray-700"
            }`}
          >
            {label}
            {selectedFilters.includes(label) && <X className="w-4 h-4 ml-2 inline" />}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Sort By
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={-5} alignOffset={0}>
            <DropdownMenuItem
              onSelect={() => {
                setSortBy("date");
              }}
              className="flex items-center"
            >
              {sortBy === "date" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Date
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setSortBy("status");
              }}
              className="flex items-center"
            >
              {sortBy === "status" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Status
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setSortBy("company");
              }}
              className="flex items-center"
            >
              {sortBy === "company" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Company Name
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={groupByCompany ? "default" : "outline"}
          onClick={() => {
            setGroupByCompany((prev) => !prev);
          }}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" /> Group by Company
        </Button>
        <Button
          variant={showArchived ? "default" : "outline"}
          onClick={() => {
            setShowArchived((prev) => !prev);
          }}
          className="flex items-center gap-2"
        >
          <Archive className="h-4 w-4" /> Show Archived
        </Button>

        <Button
          variant={showPriorityOnly ? "default" : "outline"}
          onClick={() => {
            setShowPriorityOnly((prev) => !prev);
          }}
          className="flex items-center gap-2"
        >
          <Star className="h-4 w-4 text-amber-500" /> Show Priority
        </Button>

        <Button variant="default" className="flex items-center gap-2" onClick={onAddNewJob}>
          <Plus className="h-4 w-4" /> Add New Job
        </Button>
      </div>
    </div>
  );
};

export default JobToolbar;
