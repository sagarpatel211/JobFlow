"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Filter,
  List,
  Star,
  Plus,
  Archive,
  Check,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrackerFilters } from "@/types/trackerHooks";

const filterOptions = [
  { label: "Only Not Applied Jobs", color: "bg-blue-500 text-white", icon: <Clock className="w-4 h-4 inline mr-1" /> },
  { label: "Posted <1 week", color: "bg-green-500 text-white", icon: <Calendar className="w-4 h-4 inline mr-1" /> },
  { label: "Internships", color: "bg-purple-500 text-white", icon: <Briefcase className="w-4 h-4 inline mr-1" /> },
  { label: "New Grad", color: "bg-orange-500 text-white", icon: <UserPlus className="w-4 h-4 inline mr-1" /> },
];

const filterMap: Record<string, keyof TrackerFilters> = {
  "Only Not Applied Jobs": "filterNotApplied",
  "Posted <1 week": "filterWithinWeek",
  Internships: "filterIntern",
  "New Grad": "filterNewgrad",
};

interface Props {
  filters: TrackerFilters;
  updateFilters: (newFilters: Partial<TrackerFilters>) => void;
  onAddNewJob: () => void;
}

const JobToolbar: React.FC<Props> = ({ filters, updateFilters, onAddNewJob }) => {
  const toggleFilter = useCallback(
    (label: string) => {
      const key = filterMap[label];
      if (key) {
        updateFilters({ [key]: !filters[key] });
      }
    },
    [filters, updateFilters],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilters({ searchTerm: e.target.value });
    },
    [updateFilters],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        updateFilters({ searchTerm: e.currentTarget.value });
      }
    },
    [updateFilters],
  );

  const clearSearch = useCallback(() => {
    updateFilters({ searchTerm: "" });
  }, [updateFilters]);

  const selectSortBy = useCallback(
    (sortField: string) => {
      updateFilters({ sortBy: sortField });
    },
    [updateFilters],
  );

  const toggleSortDirection = useCallback(() => {
    updateFilters({ sortDirection: filters.sortDirection === "asc" ? "desc" : "asc" });
  }, [filters.sortDirection, updateFilters]);

  const toggleGroupByCompany = useCallback(() => {
    updateFilters({ groupByCompany: !filters.groupByCompany, sortBy: filters.groupByCompany ? filters.sortBy : "company" });
  }, [filters.groupByCompany, filters.sortBy, updateFilters]);

  const toggleShowArchived = useCallback(() => {
    updateFilters({ showArchived: !filters.showArchived });
  }, [filters.showArchived, updateFilters]);

  const toggleShowPriority = useCallback(() => {
    updateFilters({ showPriorityOnly: !filters.showPriorityOnly });
  }, [filters.showPriorityOnly, updateFilters]);

  return (
    <div className="flex items-center justify-between px-4">
      <span className="flex items-center w-full max-w-md rounded-full bg-muted px-4 border-2 border-transparent focus-within:border-primary focus-within:shadow-lg transition-all">
        <Search className="text-muted-foreground" />
        <Input
          placeholder="Quick Search"
          className="w-full border-none bg-transparent outline-none focus:ring-0 focus:outline-none focus:border-transparent px-2"
          value={filters.searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />
        {filters.searchTerm && <X className="text-muted-foreground cursor-pointer" onClick={clearSearch} />}
      </span>

      <div className="flex items-center gap-2 px-4 flex-wrap">
        {filterOptions.map(({ label, color, icon }) => {
          const key = filterMap[label];
          const active = key ? filters[key] : false;
          return (
            <Badge
              key={label}
              onClick={() => toggleFilter(label)}
              className={`cursor-pointer px-3 py-1 rounded-full transition-all ${active ? `${color} shadow-lg` : "bg-gray-200 text-gray-700"}`}
            >
              {icon}
              {label}
              {active && <X className="w-4 h-4 ml-2 inline" />}
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
              disabled={filters.groupByCompany}
              title={filters.groupByCompany ? "Sorting is disabled when grouping by company" : ""}
            >
              <Filter className="h-4 w-4" /> Sort By: {filters.sortBy.charAt(0).toUpperCase() + filters.sortBy.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={-5} alignOffset={0}>
            <DropdownMenuItem onSelect={() => selectSortBy("date")} className="flex items-center">
              {filters.sortBy === "date" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Date
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => selectSortBy("status")} className="flex items-center">
              {filters.sortBy === "status" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Status
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => selectSortBy("company")} className="flex items-center">
              {filters.sortBy === "company" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Company Name
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => selectSortBy("title")} className="flex items-center">
              {filters.sortBy === "title" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Job Title
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => selectSortBy("priority")} className="flex items-center">
              {filters.sortBy === "priority" ? <Check className="mr-2 h-4 w-4" /> : <span className="w-4 mr-2" />}
              Priority
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          onClick={toggleSortDirection}
          className="flex items-center gap-2"
          disabled={filters.groupByCompany}
          title={filters.groupByCompany ? "Sorting is disabled when grouping by company" : ""}
        >
          {filters.sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </Button>
        <Button
          variant={filters.groupByCompany ? "default" : "outline"}
          onClick={toggleGroupByCompany}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" /> Group by Company
        </Button>
        <Button
          variant={filters.showArchived ? "default" : "outline"}
          onClick={toggleShowArchived}
          className="flex items-center gap-2"
        >
          <Archive className="h-4 w-4" /> Show Archived
        </Button>
        <Button
          variant={filters.showPriorityOnly ? "default" : "outline"}
          onClick={toggleShowPriority}
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
