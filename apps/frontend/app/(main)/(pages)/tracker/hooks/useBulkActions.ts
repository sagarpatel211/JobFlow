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
  refreshData: () => Promise<void>;
}

type CountResponse = {
  deleted_count?: number;
  archived_count?: number;
  marked_count?: number;
  removed_count?: number;
};

export function useBulkActions({ refreshData }: UseBulkActionsParams) {
  const runCountAction = useCallback(
    async (action: () => Promise<CountResponse>, loadingMsg: string, successMsg: (count: number) => string): Promise<void> => {
      const toastId = toast.loading(loadingMsg);
      try {
        const res = await action();
        toast.dismiss(toastId);
        const count = res.deleted_count ?? res.archived_count ?? res.marked_count ?? res.removed_count ?? 0;
        toast.success(successMsg(count));
        await refreshData();
      } catch (error) {
        toast.dismiss(toastId);
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(msg);
      }
    },
    [refreshData],
  );

  const handleDeleteOlderThan = useCallback(
    (months: number): void => {
      void runCountAction(
        () => deleteOlderThan(months),
        "Deleting old jobs…",
        (count) => `Deleted ${String(count)} job${count !== 1 ? "s" : ""}`,
      );
    },
    [runCountAction],
  );

  const handleRemoveDeadLinks = useCallback((): void => {
    void runCountAction(
      removeDeadLinks as () => Promise<CountResponse>,
      "Checking for dead links…",
      (count) => `${String(count)} dead link${count !== 1 ? "s" : ""} found`,
    );
  }, [runCountAction]);

  const handleArchiveRejected = useCallback((): void => {
    void runCountAction(
      archiveRejected,
      "Archiving rejected applications…",
      (count) => `Archived ${String(count)} rejected application${count !== 1 ? "s" : ""}`,
    );
  }, [runCountAction]);

  const handleArchiveAppliedOlderThan = useCallback(
    (months: number): void => {
      void runCountAction(
        () => archiveAppliedOlderThan(months),
        `Archiving applied jobs older than ${String(months)} month${months !== 1 ? "s" : ""}…`,
        (count) => `Archived ${String(count)} applied job${count !== 1 ? "s" : ""}`,
      );
    },
    [runCountAction],
  );

  const handleMarkOldestAsPriority = useCallback((): void => {
    void runCountAction(
      markOldestAsPriority,
      "Marking oldest jobs as priority…",
      (count) => `Marked ${String(count)} job${count !== 1 ? "s" : ""}`,
    );
  }, [runCountAction]);

  const handleScrape = useCallback(
    (scraping: boolean): void => {
      if (scraping) {
        void cancelScrape()
          .then((res) => {
            if (res.success) {
              toast.success("Scrape cancelled");
              void refreshData();
            } else {
              toast.error("Failed to cancel scrape");
            }
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            toast.error(msg);
          });
        return;
      }

      void startScrape()
        .then((res) => {
          if (!res.success) {
            toast.error("Failed to start scrape");
            return;
          }
          toast.success("Scrape started");
          const intervalId = setInterval(() => {
            void getScrapeStatus()
              .then((status) => {
                if (!status.scraping) {
                  clearInterval(intervalId);
                  void refreshData().then(() => toast.success("Scrape completed"));
                }
              })
              .catch((err: unknown) => console.error("Error polling scrape status:", err));
          }, 10000);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          toast.error(msg);
        });
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
