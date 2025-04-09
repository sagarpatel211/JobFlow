import { Job, RoleType, JobStatus } from "./job";
import { TrackerData } from "./tracker";

export interface APIResponse {
  success: boolean;
  error?: string;
  message?: string;
  scraping?: boolean;
  job?: Job;
  trackerData?: TrackerData;
  archived?: boolean;
  priority?: boolean;
}

// Add helper interface for backend job
export interface BackendJob {
  company?: { name: string };
  title?: string;
  role_type?: RoleType;
  status?: JobStatus;
  posted_date?: string;
  link?: string;
  priority?: boolean;
  archived?: boolean;
  ats_score?: number;
  tags?: string[];
  notes?: string;
}

export interface TrackerAPIResponse {
  success: boolean;
  trackerData: TrackerData;
  error?: string;
}

export interface AddJobResponse {
  success: boolean;
  job: Job;
}

export interface UpdateJobResponse {
  success: boolean;
  job: Job;
}

export interface ScrapeResponse {
  success: boolean;
  scraping: boolean;
  data?: unknown;
}

export interface CancelScrapeResponse {
  success: boolean;
  scraping: boolean;
}
