import { Job } from "./job";
import { PaginationData } from "./pagination";

export interface StatusCounts {
  nothing_done: number;
  applying: number;
  applied: number;
  oa: number;
  interview: number;
  offer: number;
  rejected: number;
  [key: string]: number;
}

export interface ScrapeInfo {
  scraping: boolean;
  scrapeProgress: number;
  estimatedSeconds: number;
}

export interface Health {
  isHealthy: boolean;
}

export interface TrackerData {
  jobs: Job[];
  statusCounts: StatusCounts;
  pagination: PaginationData;
  scrapeInfo: ScrapeInfo;
  health: Health;
}
