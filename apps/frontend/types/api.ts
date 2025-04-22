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
  company?: { name: string; image_url?: string | null };
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
  company_image_url?: string | null;
}

export interface TrackerAPIResponse extends APIResponse {
  jobs: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  statusCounts: Record<string, number>;
  health: {
    isHealthy: boolean;
  };
  scrapeInfo: {
    scraping: boolean;
    scrapeProgress: number;
    estimatedSeconds: number;
  };
}

export interface AddJobResponse {
  success: boolean;
  job: {
    id: number;
    company: string;
    title: string;
    link: string;
    postedDate: string;
    status: string;
    statusIndex: number;
    priority: boolean;
    archived: boolean;
    [key: string]: any;
  };
  error?: string;
}

export interface UpdateJobResponse {
  success: boolean;
  job: {
    id: number;
    [key: string]: any;
  };
  error?: string;
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
