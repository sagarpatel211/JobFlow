import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { UseBulkActionsProps } from "@/types/trackerHooks";
import { deleteOlderThan } from "../services/api";

export function useBulkActions({ baseUrl, refreshData }: UseBulkActionsProps) {
  // Delete jobs older than a certain number of months
  const handleDeleteOlderThan = useCallback(
    async (months: number): Promise<void> => {
      try {
        toast.loading("Deleting old data...");
        const result = await deleteOlderThan(months);

        toast.dismiss();
        toast.success(`Successfully deleted ${String(result.deleted_count)} jobs older than ${String(months)} months`);

        // Refresh the data
        await refreshData();
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to delete data: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error deleting old data:", error);
      }
    },
    [refreshData],
  );

  // Remove dead links
  const handleRemoveDeadLinks = useCallback(async (): Promise<void> => {
    try {
      toast.loading("Checking for dead links...");
      const response = await fetch(`${baseUrl}/api/jobs/remove-dead-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to remove dead links");
      }

      const result = (await response.json()) as { removed_count: number };
      toast.dismiss();
      toast.success(`Successfully removed ${String(result.removed_count)} dead links`);

      // Refresh the data
      await refreshData();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to remove dead links: " + (error instanceof Error ? error.message : "Unknown error"));
      console.error("Error removing dead links:", error);
    }
  }, [baseUrl, refreshData]);

  // Archive rejected jobs
  const handleArchiveRejected = useCallback(async (): Promise<void> => {
    try {
      toast.loading("Archiving rejected applications...");
      const response = await fetch(`${baseUrl}/api/jobs/archive-rejected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to archive rejected applications");
      }

      const result = (await response.json()) as { archived_count: number };
      toast.dismiss();
      toast.success(`Successfully archived ${String(result.archived_count)} rejected applications`);

      // Refresh the data
      await refreshData();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to archive applications: " + (error instanceof Error ? error.message : "Unknown error"));
      console.error("Error archiving applications:", error);
    }
  }, [baseUrl, refreshData]);

  // Archive applied jobs older than a certain number of months
  const handleArchiveAppliedOlderThan = useCallback(
    async (months: number): Promise<void> => {
      try {
        toast.loading(`Archiving applied jobs older than ${String(months)} months...`);
        const response = await fetch(`${baseUrl}/api/jobs/archive-applied-older-than/${String(months)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || "Failed to archive applied jobs");
        }

        const result = (await response.json()) as { archived_count: number };
        toast.dismiss();
        toast.success(
          `Successfully archived ${String(result.archived_count)} applied jobs older than ${String(months)} months`,
        );

        // Refresh the data
        await refreshData();
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to archive jobs: " + (error instanceof Error ? error.message : "Unknown error"));
        console.error("Error archiving jobs:", error);
      }
    },
    [baseUrl, refreshData],
  );

  // Mark oldest jobs as priority
  const handleMarkOldestAsPriority = useCallback(async (): Promise<void> => {
    try {
      toast.loading("Marking oldest 50 jobs as priority...");
      const response = await fetch(`${baseUrl}/api/jobs/mark-oldest-as-priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to mark jobs as priority");
      }

      const result = (await response.json()) as { marked_count: number };
      toast.dismiss();
      toast.success(`Successfully marked ${String(result.marked_count)} oldest jobs as priority`);

      // Refresh the data
      await refreshData();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to mark jobs: " + (error instanceof Error ? error.message : "Unknown error"));
      console.error("Error marking jobs:", error);
    }
  }, [baseUrl, refreshData]);

  // Handle scraping
  const handleScrape = useCallback(
    async (isScraping: boolean): Promise<void> => {
      if (isScraping) {
        try {
          const response = await fetch(`${baseUrl}/api/scrape/cancel`, { method: "POST" });
          if (!response.ok) throw new Error("Failed to cancel scrape");

          const data = (await response.json()) as { success: boolean };
          if (data.success) {
            toast.success("Scrape cancelled");
            await refreshData();
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to cancel scrape");
        }
      } else {
        try {
          const response = await fetch(`${baseUrl}/api/scrape`, { method: "POST" });
          if (!response.ok) throw new Error("Failed to start scrape");

          const data = (await response.json()) as { success: boolean };
          if (data.success) {
            toast.success("Scrape started");

            const interval = setInterval(() => {
              const checkStatus = async () => {
                try {
                  const statusResponse = await fetch(`${baseUrl}/api/scrape/status`);
                  const statusData = (await statusResponse.json()) as { scraping: boolean };

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
    [baseUrl, refreshData],
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
