import { TrackerData } from "@/types/tracker";

export const statusKeys = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"] as const;

export type StatusKey = (typeof statusKeys)[number];

export const getStatusFromIndex = (index: number): StatusKey => {
  return statusKeys[Math.max(0, Math.min(index, statusKeys.length - 1))];
};

export const defaultTrackerData: TrackerData = {
  jobs: [],
  statusCounts: {
    nothing_done: 0,
    applying: 0,
    applied: 0,
    OA: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  },
  pagination: {
    totalJobs: 0,
    currentPage: 1,
    itemsPerPage: 4,
    totalPages: 1,
  },
  scrapeInfo: {
    scraping: false,
    scrapeProgress: 0,
    estimatedSeconds: 0,
  },
  health: { isHealthy: false },
};
