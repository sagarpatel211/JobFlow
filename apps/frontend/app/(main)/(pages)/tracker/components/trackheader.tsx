"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HeartPulse, MoreVertical, Trash2, Link2Off, Archive, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import InputDialog from "./inputdialog";
import ConfirmationDialog from "./confirmationdialog";

// Types for action confirmation dialogs
type ActionType =
  | "none"
  | "removeDeadLinks"
  | "archiveRejected"
  | "markOldestAsPriority"
  | "deleteOlderThan3"
  | "deleteOlderThan6"
  | "deleteOlderThan12";

interface TrackerHeaderProps {
  isHealthy: boolean;
  scraping: boolean;
  scrapeProgress: number;
  estimatedSeconds: number;
  onScrape: () => void;
  onDeleteOlderThan: (months: number) => void;
  onRemoveDeadLinks: () => void;
  onArchiveRejected: () => void;
  onArchiveAppliedOlderThan: (months: number) => void;
  onMarkOldestAsPriority: () => void;
}

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({
  isHealthy,
  scraping,
  scrapeProgress,
  estimatedSeconds,
  onScrape,
  onDeleteOlderThan,
  onRemoveDeadLinks,
  onArchiveRejected,
  onArchiveAppliedOlderThan,
  onMarkOldestAsPriority,
}) => {
  // State for the input dialog (months)
  const [isMonthsDialogOpen, setIsMonthsDialogOpen] = useState(false);

  // State for confirmation dialogs
  const [confirmActionType, setConfirmActionType] = useState<ActionType>("none");
  const isConfirmDialogOpen = confirmActionType !== "none";

  // Helper to close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmActionType("none");
  };

  // Dialog state handlers
  const handleOpenMonthsDialog = () => {
    setIsMonthsDialogOpen(true);
  };

  const handleCloseMonthsDialog = () => {
    setIsMonthsDialogOpen(false);
  };

  // Get confirmation dialog properties based on action type
  const getConfirmationProps = () => {
    switch (confirmActionType) {
      case "removeDeadLinks":
        return {
          title: "Remove Dead Links",
          description: "This will check all job links and mark broken ones (404 errors). Do you want to continue?",
          confirmText: "Check Links",
          icon: <Link2Off className="h-5 w-5 text-blue-500" />,
          onConfirm: onRemoveDeadLinks,
          variant: "default" as const,
        };
      case "archiveRejected":
        return {
          title: "Archive Rejected Applications",
          description: "This will archive all jobs with 'rejected' status. Do you want to continue?",
          confirmText: "Archive All",
          icon: <Archive className="h-5 w-5 text-orange-500" />,
          onConfirm: onArchiveRejected,
          variant: "default" as const,
        };
      case "markOldestAsPriority":
        return {
          title: "Mark Oldest Jobs as Priority",
          description: "This will mark the 50 oldest non-priority jobs as priority. Do you want to continue?",
          confirmText: "Mark as Priority",
          icon: <Star className="h-5 w-5 text-amber-500" />,
          onConfirm: onMarkOldestAsPriority,
          variant: "default" as const,
        };
      case "deleteOlderThan3":
        return {
          title: "Delete Older Data",
          description: "This will permanently delete all job data older than 3 months. This action cannot be undone.",
          confirmText: "Delete",
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          onConfirm: () => onDeleteOlderThan(3),
          variant: "destructive" as const,
        };
      case "deleteOlderThan6":
        return {
          title: "Delete Older Data",
          description: "This will permanently delete all job data older than 6 months. This action cannot be undone.",
          confirmText: "Delete",
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          onConfirm: () => onDeleteOlderThan(6),
          variant: "destructive" as const,
        };
      case "deleteOlderThan12":
        return {
          title: "Delete Older Data",
          description: "This will permanently delete all job data older than 1 year. This action cannot be undone.",
          confirmText: "Delete",
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          onConfirm: () => onDeleteOlderThan(12),
          variant: "destructive" as const,
        };
      default:
        return {
          title: "",
          description: "",
          confirmText: "Confirm",
          onConfirm: () => {},
          variant: "default" as const,
        };
    }
  };

  const confirmationProps = getConfirmationProps();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-4 md:p-6 text-3xl md:text-4xl backdrop-blur-lg">
      <span>Tracker</span>
      <div className="flex items-center gap-2 md:gap-4 text-sm md:text-base">
        <div className="hidden sm:flex items-center gap-2">
          <HeartPulse
            className={`w-5 h-5 md:w-6 md:h-6 ${isHealthy ? "text-green-500 animate-pulse" : "text-red-500"}`}
          />
          <span className={`${isHealthy ? "text-green-600" : "text-red-600"} font-medium`}>
            {isHealthy ? "Healthy" : "Unhealthy"}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant={scraping ? "destructive" : "default"} onClick={onScrape} size="sm" className="md:text-base">
            {scraping ? "Cancel Scrape" : "Scrape"}
          </Button>

          {scraping && (
            <div className="hidden sm:flex items-center gap-3 w-[180px] md:w-[220px]">
              <Progress className="w-full" value={scrapeProgress} />
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{estimatedSeconds}s</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                <MoreVertical className="h-4 w-4" />
                <span className="hidden sm:inline">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] md:w-[320px] lg:w-[350px]" sideOffset={4}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="max-h-[60vh] overflow-y-auto">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setConfirmActionType("removeDeadLinks")}
                    className="flex items-center py-2"
                  >
                    <Link2Off className="mr-2 h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Attempt dead link removals (404s)</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setConfirmActionType("archiveRejected")}
                    className="flex items-center py-2"
                  >
                    <Archive className="mr-2 h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Archive all rejected applications</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleOpenMonthsDialog} className="flex items-center py-2">
                    <Archive className="mr-2 h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Archive applied jobs older than X months</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setConfirmActionType("markOldestAsPriority")}
                    className="flex items-center py-2"
                  >
                    <Star className="mr-2 h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Mark oldest 50 jobs as priority</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Cleanup</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setConfirmActionType("deleteOlderThan3")}
                    className="flex items-center py-2"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Delete data older than 3 months</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setConfirmActionType("deleteOlderThan6")}
                    className="flex items-center py-2"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Delete data older than 6 months</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setConfirmActionType("deleteOlderThan12")}
                    className="flex items-center py-2"
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="flex-grow truncate">Delete data older than 1 year</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Input dialog for archiving applied jobs */}
      <InputDialog
        isOpen={isMonthsDialogOpen}
        onClose={handleCloseMonthsDialog}
        onConfirm={onArchiveAppliedOlderThan}
        title="Archive Applied Jobs"
        description="Archive all applications with 'applied' status that are older than the specified number of months"
        label="Months"
        placeholder="Enter number of months"
        defaultValue={3}
        confirmText="Archive"
        variant="default"
      />

      {/* Confirmation dialog for other actions */}
      {isConfirmDialogOpen && (
        <ConfirmationDialog
          isOpen={isConfirmDialogOpen}
          onClose={closeConfirmDialog}
          onConfirm={confirmationProps.onConfirm}
          title={confirmationProps.title}
          description={confirmationProps.description}
          confirmText={confirmationProps.confirmText}
          variant={confirmationProps.variant}
          icon={confirmationProps.icon}
        />
      )}
    </header>
  );
};

export default TrackerHeader;
