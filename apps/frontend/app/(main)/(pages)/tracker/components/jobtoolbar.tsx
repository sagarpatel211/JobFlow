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
import { Filter, List, Star, Plus, Archive, Check, Search, X, ArrowUp, ArrowDown } from "lucide-react";
import type { JobToolbarProps } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import { TrackerFilters } from "@/types/trackerHooks";

const filterOptions = [
  { label: "Only Not Applied Jobs", color: "bg-blue-500 text-white" },
  { label: "Posted <1 week", color: "bg-green-500 text-white" },
  { label: "Internships", color: "bg-purple-500 text-white" },
  { label: "New Grad", color: "bg-orange-500 text-white" },
];

// Map display labels to filter state keys
const filterMap: Record<string, keyof TrackerFilters> = {
  "Only Not Applied Jobs": "filterNotApplied",
  "Posted <1 week": "filterWithinWeek",
  Internships: "filterIntern",
  "New Grad": "filterNewgrad",
};

const JobToolbar = ({
  sortBy,
  setSortBy,
  groupByCompany,
  setGroupByCompany,
  showArchived,
  setShowArchived,
  showPriorityOnly,
  setShowPriorityOnly,
  onAddNewJob,
  sortDirection,
  setSortDirection,
  updateFilters,
  filters,
}: JobToolbarProps & {
  updateFilters: (filters: Partial<TrackerFilters>) => void;
  filters: TrackerFilters;
}) => {
  const toggleFilter = (label: string) => {
    const filterKey = filterMap[label];
    if (filterKey) {
      updateFilters({ [filterKey]: !filters[filterKey] });
    }
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
        {filterOptions.map(({ label, color }) => {
          const filterKey = filterMap[label];
          const isActive = filterKey && filters[filterKey];
          return (
            <Badge
              key={label}
              onClick={() => toggleFilter(label)}
              className={`cursor-pointer px-3 py-1 rounded-full transition-all ${isActive ? `${color} shadow-lg` : "bg-gray-200 text-gray-700"}`}
            >
              {label}
              {isActive && <X className="w-4 h-4 ml-2 inline" />}
            </Badge>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={groupByCompany}
              title={groupByCompany ? "Sorting is disabled when grouping by company" : ""}
            >
              <Filter className="h-4 w-4" /> Sort By: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
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
          variant="outline"
          onClick={() => {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
          }}
          className="flex items-center gap-2"
          disabled={groupByCompany}
          title={groupByCompany ? "Sorting is disabled when grouping by company" : ""}
        >
          {sortDirection === "asc" ? (
            <>
              <ArrowUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <ArrowDown className="h-4 w-4" />
            </>
          )}
        </Button>

        <Button
          variant={groupByCompany ? "default" : "outline"}
          onClick={() => {
            // If turning on groupByCompany, set sort to "company" as default
            if (!groupByCompany) {
              setSortBy("company");
            }
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
