import { Job } from "./job";

export interface TrackerData {
  jobs: Job[];
  statusCounts: {
    nothingDone: number;
    applying: number;
    applied: number;
    OA: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  pagination: {
    totalJobs: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
  scrapeInfo: {
    scraping: boolean;
    scrapeProgress: number;
    estimatedSeconds: number;
  };
  health: {
    isHealthy: boolean;
  };
}
