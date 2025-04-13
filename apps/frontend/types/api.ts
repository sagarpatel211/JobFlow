import { Job, RoleType, JobStatus, Folder } from "./job";
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
  folders?: Folder[];
  notes?: string;
}

// API response interfaces for specific endpoints
export interface GetJobsResponse {
  success: boolean;
  jobs: BackendJobResponse[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    per_page: number;
  };
}

export interface BackendJobResponse {
  id: number;
  company: string;
  title: string;
  role_type: string;
  status: string;
  posted_date: string;
  link: string;
  priority: boolean;
  archived: boolean;
  deleted: boolean;
  ats_score: number;
  tags: string[];
  folders: Folder[];
  notes: string;
  statusIndex?: number;
}

export interface TagsResponse {
  success: boolean;
  tags: Array<{ id: number; name: string }>;
}

export interface FoldersResponse {
  success: boolean;
  folders: Folder[];
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
