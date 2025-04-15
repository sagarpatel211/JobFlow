import { useCallback } from "react";
import {
  deleteOlderThan,
  removeDeadLinks,
  archiveRejected,
  archiveAppliedOlderThan,
  markOldestAsPriority,
  startScrape,
  cancelScrape,
  getScrapeStatus,
} from "../services/api";
import { toast } from "react-hot-toast";

interface UseBulkActionsParams {
  baseUrl: string;
  refreshData: () => Promise<void>;
}

export function useBulkActions({ baseUrl, refreshData }: UseBulkActionsParams) {
  const handleDeleteOlderThan = useCallback(
    async (months: number): Promise<void> => {
      try {
        toast.loading("Deleting old data...");
        const result = await deleteOlderThan(months);
        toast.dismiss();
        toast.success(`Successfully deleted ${String(result.deleted_count)} jobs older than ${String(months)} months`);
        await refreshData();
      } catch (error) {
        toast.dismiss();
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to delete old jobs: " + errorMessage);
      }
    },
    [refreshData],
  );

  const handleRemoveDeadLinks = useCallback(async (): Promise<void> => {
    try {
      toast.loading("Checking for dead links...");
      const result = await removeDeadLinks();
      toast.dismiss();
      toast.success(`Successfully identified ${String(result.removed_count)} links with issues`);
      await refreshData();
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to check links: " + errorMessage);
      console.error("Error checking links:", error);
    }
  }, [refreshData]);

  const handleArchiveRejected = useCallback(async (): Promise<void> => {
    try {
      toast.loading("Archiving rejected applications...");
      const result = await archiveRejected();
      toast.dismiss();
      toast.success(`Successfully archived ${String(result.archived_count)} rejected applications`);
      await refreshData();
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to archive rejected jobs: " + errorMessage);
    }
  }, [refreshData]);

  const handleArchiveAppliedOlderThan = useCallback(
    async (months: number): Promise<void> => {
      try {
        toast.loading(`Archiving applied jobs older than ${String(months)} months...`);
        const result = await archiveAppliedOlderThan(months);
        toast.dismiss();
        toast.success(`Successfully archived ${String(result.archived_count)} applied jobs older than ${String(months)} months`);
        await refreshData();
      } catch (error) {
        toast.dismiss();
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to archive jobs: " + errorMessage);
        console.error("Error archiving jobs:", error);
      }
    },
    [refreshData],
  );

  const handleMarkOldestAsPriority = useCallback(async (): Promise<void> => {
    try {
      toast.loading("Marking oldest 50 jobs as priority...");
      const result = await markOldestAsPriority();
      toast.dismiss();
      toast.success(`Successfully marked ${String(result.marked_count)} oldest jobs as priority`);
      await refreshData();
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to mark jobs: " + errorMessage);
      console.error("Error marking jobs:", error);
    }
  }, [refreshData]);

  const handleScrape = useCallback(
    async (isScraping: boolean): Promise<void> => {
      if (isScraping) {
        try {
          const result = await cancelScrape();
          if (result.success) {
            toast.success("Scrape cancelled");
            await refreshData();
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to cancel scrape");
        }
      } else {
        try {
          const result = await startScrape();
          if (result.success) {
            toast.success("Scrape started");

            const interval = setInterval(() => {
              const checkStatus = async () => {
                try {
                  const statusData = await getScrapeStatus();
                  if (!statusData.scraping) {
                    clearInterval(interval);
                    await refreshData();
                    toast.success("Scrape completed!");
                  }
                } catch (error) {
                  console.error("Error checking scrape status:", error);
                }
              };

              void checkStatus();
            }, 2000);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to start scrape");
        }
      }
    },
    [refreshData],
  );

  return {
    handleDeleteOlderThan,
    handleRemoveDeadLinks,
    handleArchiveRejected,
    handleArchiveAppliedOlderThan,
    handleMarkOldestAsPriority,
    handleScrape,
  };
}
