"use client";
import React, { useState, useCallback, useMemo } from "react";
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
import { TrackerHeaderProps } from "@/types/trackerComponents";
import { HotkeysDialog } from "./hotkeysdialog";

type ActionType =
  | "none"
  | "removeDeadLinks"
  | "archiveRejected"
  | "markOldestAsPriority"
  | "deleteOlderThan3"
  | "deleteOlderThan6"
  | "deleteOlderThan12";

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
  const [isMonthsDialogOpen, setIsMonthsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("none");
  const isConfirmOpen = actionType !== "none";

  const closeConfirm = useCallback(() => setActionType("none"), []);
  const openMonths = useCallback(() => setIsMonthsDialogOpen(true), []);
  const closeMonths = useCallback(() => setIsMonthsDialogOpen(false), []);
  const handlers = {
    removeDeadLinks: useCallback(() => setActionType("removeDeadLinks"), []),
    archiveRejected: useCallback(() => setActionType("archiveRejected"), []),
    markOldest: useCallback(() => setActionType("markOldestAsPriority"), []),
    delete3: useCallback(() => setActionType("deleteOlderThan3"), []),
    delete6: useCallback(() => setActionType("deleteOlderThan6"), []),
    delete12: useCallback(() => setActionType("deleteOlderThan12"), []),
  };

  const confirmation = useMemo(() => {
    switch (actionType) {
      case "removeDeadLinks":
        return {
          title: "Remove Dead Links",
          description: "Check all job links and mark broken ones (404).",
          confirmText: "Check Links",
          icon: <Link2Off className="h-5 w-5 text-blue-500" />,
          onConfirm: onRemoveDeadLinks,
          variant: "default" as const,
        };
      case "archiveRejected":
        return {
          title: "Archive Rejected Applications",
          description: "Archive all jobs with 'rejected' status.",
          confirmText: "Archive All",
          icon: <Archive className="h-5 w-5 text-orange-500" />,
          onConfirm: onArchiveRejected,
          variant: "default" as const,
        };
      case "markOldestAsPriority":
        return {
          title: "Mark Oldest Jobs as Priority",
          description: "Mark the 50 oldest non-priority jobs as priority.",
          confirmText: "Mark as Priority",
          icon: <Star className="h-5 w-5 text-amber-500" />,
          onConfirm: onMarkOldestAsPriority,
          variant: "default" as const,
        };
      case "deleteOlderThan3":
        return {
          title: "Delete Older Data",
          description: "Delete all job data older than 3 months.",
          confirmText: "Delete",
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          onConfirm: () => onDeleteOlderThan(3),
          variant: "destructive" as const,
        };
      case "deleteOlderThan6":
        return {
          title: "Delete Older Data",
          description: "Delete all job data older than 6 months.",
          confirmText: "Delete",
          icon: <Trash2 className="h-5 w-5 text-red-500" />,
          onConfirm: () => onDeleteOlderThan(6),
          variant: "destructive" as const,
        };
      case "deleteOlderThan12":
        return {
          title: "Delete Older Data",
          description: "Delete all job data older than 12 months.",
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
          icon: null,
          onConfirm: () => {},
          variant: "default" as const,
        };
    }
  }, [actionType, onRemoveDeadLinks, onArchiveRejected, onMarkOldestAsPriority, onDeleteOlderThan]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/50 p-4 md:p-6 text-3xl md:text-4xl backdrop-blur-lg">
      <span>Tracker</span>
      <div className="flex items-center gap-2 md:gap-4 text-sm md:text-base">
        <div className="hidden sm:flex items-center gap-2">
          <HeartPulse className={`w-5 h-5 ${isHealthy ? "text-green-500 animate-pulse" : "text-red-500"}`} />
          <span className={`${isHealthy ? "text-green-600" : "text-red-600"} font-medium`}>
            {isHealthy ? "Healthy" : "Unhealthy"}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant={scraping ? "destructive" : "default"} onClick={onScrape} size="sm">
            {scraping ? "Cancel Scrape" : "Scrape"}
          </Button>
          {scraping && (
            <div className="hidden sm:flex items-center gap-3 w-[180px] md:w-[220px]">
              <Progress className="w-full" value={scrapeProgress} />
              <span className="text-xs text-muted-foreground">{estimatedSeconds}s</span>
            </div>
          )}
          <HotkeysDialog />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                <MoreVertical className="h-4 w-4" /> <span className="hidden sm:inline">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4} className="w-[280px] md:w-[320px] lg:w-[350px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[60vh] overflow-y-auto">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handlers.removeDeadLinks}>
                    <Link2Off className="mr-2 h-4 w-4 text-blue-500" /> Attempt dead link removals (404s)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlers.archiveRejected}>
                    <Archive className="mr-2 h-4 w-4 text-orange-500" /> Archive rejected applications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openMonths}>
                    <Archive className="mr-2 h-4 w-4 text-orange-500" /> Archive applied jobs older than X months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlers.markOldest}>
                    <Star className="mr-2 h-4 w-4 text-amber-500" /> Mark oldest 50 jobs as priority
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Cleanup</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handlers.delete3}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Delete data older than 3 months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlers.delete6}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Delete data older than 6 months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlers.delete12}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Delete data older than 12 months
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <InputDialog
        isOpen={isMonthsDialogOpen}
        onClose={closeMonths}
        onConfirm={onArchiveAppliedOlderThan}
        title="Archive Applied Jobs"
        description="Archive all applications older than specified months"
        label="Months"
        defaultValue={3}
        confirmText="Archive"
      />
      {isConfirmOpen && (
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onClose={closeConfirm}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          description={confirmation.description}
          confirmText={confirmation.confirmText}
          variant={confirmation.variant}
          icon={confirmation.icon}
        />
      )}
    </header>
  );
};

export default TrackerHeader;
