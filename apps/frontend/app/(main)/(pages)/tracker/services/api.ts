import { Job, RoleType, JobStatus } from "@/types/job";
import { APIResponse, BackendJob, TrackerAPIResponse, AddJobResponse, UpdateJobResponse } from "@/types/api";
import { format } from "date-fns";
import { getStatusFromIndex } from "./constants";

const BASE_URL_RAW: string = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE_URL: string = BASE_URL_RAW.endsWith("/") ? BASE_URL_RAW.slice(0, -1) : BASE_URL_RAW;
const API_HEADERS = { "Content-Type": "application/json" };

function safeString(value: number | string): string {
  return String(value);
}

function validateDateString(dateStr: string | undefined | null): string {
  if (!dateStr) return format(new Date(), "yyyy-MM-dd");
  try {
    if (dateStr.includes(".")) {
      const [day, month, year] = dateStr.split(".").map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
      return format(date, "yyyy-MM-dd");
    } else {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
      return format(date, "yyyy-MM-dd");
    }
  } catch (error: unknown) {
    console.error("Date validation error:", error);
    return format(new Date(), "yyyy-MM-dd");
  }
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    let errorMessage = `Request failed with status: ${safeString(response.status)}`;
    try {
      const errorData: unknown = await response.json();
      if (typeof errorData === "object" && errorData !== null && "error" in errorData) {
        errorMessage = String((errorData as { error?: unknown }).error);
      }
    } catch (_e) {}
    throw new Error(errorMessage);
  }
  return response.json() as T;
}

export async function fetchTrackerData(params: URLSearchParams): Promise<TrackerAPIResponse> {
  const url = `${BASE_URL}/api/tracker?${params.toString()}`;
  const data = await apiRequest<TrackerAPIResponse>(url);
  if (!data.success) throw new Error(String(data.error) || "Failed to fetch tracker data");
  return data;
}

export async function getJobs(): Promise<Job[]> {
  interface RawJob {
    id: number;
    company: string;
    title: string;
    link: string;
    posted_date: string;
    status: JobStatus;
    role_type: RoleType;
    priority: boolean;
    archived: boolean;
    atsScore?: number;
    tags?: string[];
    notes?: string;
    follower_count?: number;
    [key: string]: unknown;
  }
  interface JobResponse { jobs: RawJob[]; }
  const data = await apiRequest<JobResponse>(`${BASE_URL}/api/jobs`);
  return data.jobs.map((job) => ({
    id: job.id,
    company: job.company,
    title: job.title,
    link: job.link,
    postedDate: job.posted_date,
    status: job.status,
    role_type: job.role_type,
    priority: job.priority,
    archived: job.archived,
    statusIndex: 0,
    isModifying: false,
    deleted: false,
    atsScore: job.atsScore,
    tags: job.tags,
    notes: job.notes,
    followerCount: job.follower_count ? Number(job.follower_count) : 0,
  }));
}

export async function addJob(job: Job): Promise<AddJobResponse> {
  const backendJob: BackendJob = {
    company: { name: job.company },
    title: job.title,
    role_type: job.role_type ?? "newgrad",
    status: job.status ?? "nothing_done",
    posted_date: validateDateString(job.postedDate),
    link: job.link,
    priority: job.priority,
    archived: job.archived,
    ats_score: job.atsScore || 0,
    tags: job.tags || [],
    notes: job.notes || "",
  };
  return await apiRequest<AddJobResponse>(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ job: backendJob }),
  });
}

export async function updateJob(id: number, job: Partial<Job>): Promise<UpdateJobResponse> {
  function createBackendJob(job: Partial<Job>): BackendJob {
    const backendJob: BackendJob = {};
    if (job.company !== undefined) backendJob.company = { name: job.company };
    if (job.title !== undefined) backendJob.title = job.title;
    if (job.role_type !== undefined) backendJob.role_type = job.role_type;
    if (job.statusIndex !== undefined || job.status !== undefined) {
      backendJob.status = job.status || (job.statusIndex !== undefined ? getStatusFromIndex(job.statusIndex) : undefined);
    }
    if (job.postedDate !== undefined) backendJob.posted_date = validateDateString(job.postedDate);
    if (job.link !== undefined) backendJob.link = job.link;
    if (job.priority !== undefined) backendJob.priority = job.priority;
    if (job.archived !== undefined) backendJob.archived = job.archived;
    if (job.atsScore !== undefined) backendJob.ats_score = job.atsScore;
    if (job.tags !== undefined) backendJob.tags = job.tags;
    if (job.notes !== undefined) backendJob.notes = job.notes;
    return backendJob;
  }
  const backendJob = createBackendJob(job);
  return await apiRequest<UpdateJobResponse>(`${BASE_URL}/api/jobs/${safeString(id)}`, {
    method: "PUT",
    headers: API_HEADERS,
    body: JSON.stringify({ job: backendJob }),
  });
}

export async function archiveJob(id: number): Promise<APIResponse> {
  return await apiRequest<APIResponse>(`${BASE_URL}/api/jobs/${safeString(id)}/archive`, {
    method: "PUT",
    headers: API_HEADERS,
  });
}

export async function togglePriorityJob(id: number): Promise<{ success: boolean; priority: boolean }> {
  return await apiRequest<{ success: boolean; priority: boolean }>(`${BASE_URL}/api/jobs/${safeString(id)}/priority`, {
    method: "PUT",
    headers: API_HEADERS,
  });
}

export async function deleteJob(id: number): Promise<APIResponse> {
  return await apiRequest<APIResponse>(`${BASE_URL}/api/jobs/${safeString(id)}/soft-delete`, {
    method: "PUT",
    headers: API_HEADERS,
  });
}

export async function updateJobStatusArrow(id: number, direction: number): Promise<APIResponse> {
  return await apiRequest<APIResponse>(`${BASE_URL}/api/jobs/${safeString(id)}/status-arrow`, {
    method: "PUT",
    headers: API_HEADERS,
    body: JSON.stringify({ direction }),
  });
}

export async function deleteOlderThan(months: number): Promise<{ deleted_count: number }> {
  return await apiRequest<{ deleted_count: number }>(`${BASE_URL}/api/jobs/delete-older-than/${safeString(months)}`, {
    method: "DELETE",
    headers: API_HEADERS,
  });
}

export async function removeDeadLinks(): Promise<{ removed_count: number }> {
  return await apiRequest<{ removed_count: number }>(`${BASE_URL}/api/jobs/remove-dead-links`, {
    method: "POST",
    headers: API_HEADERS,
  });
}

export async function archiveRejected(): Promise<{ archived_count: number }> {
  return await apiRequest<{ archived_count: number }>(`${BASE_URL}/api/jobs/archive-rejected`, {
    method: "POST",
    headers: API_HEADERS,
  });
}

export async function archiveAppliedOlderThan(months: number): Promise<{ archived_count: number }> {
  return await apiRequest<{ archived_count: number }>(`${BASE_URL}/api/jobs/archive-applied-older-than/${safeString(months)}`, {
    method: "POST",
    headers: API_HEADERS,
  });
}

export async function markOldestAsPriority(): Promise<{ marked_count: number }> {
  return await apiRequest<{ marked_count: number }>(`${BASE_URL}/api/jobs/mark-oldest-as-priority`, {
    method: "POST",
    headers: API_HEADERS,
  });
}

export async function startScrape(): Promise<{ success: boolean }> {
  return await apiRequest<{ success: boolean }>(`${BASE_URL}/api/scrape`, {
    method: "POST",
    headers: API_HEADERS,
  });
}

export async function cancelScrape(): Promise<{ success: boolean }> {
  return await apiRequest<{ success: boolean }>(`${BASE_URL}/api/scrape/cancel`, {
    method: "POST",
    headers: API_HEADERS,
  });
}

export async function getScrapeStatus(): Promise<{ scraping: boolean }> {
  return await apiRequest<{ scraping: boolean }>(`${BASE_URL}/api/scrape/status`);
}

export async function getHealthStatus(): Promise<{ isHealthy: boolean }> {
  return await apiRequest<{ isHealthy: boolean }>(`${BASE_URL}/api/health`);
}

export async function whitelistCompany(company: string): Promise<APIResponse> {
  return await apiRequest<APIResponse>(`${BASE_URL}/api/companies/whitelist/${encodeURIComponent(company)}`, {
    method: "PUT",
    headers: API_HEADERS,
  });
}

export async function blacklistCompany(company: string): Promise<APIResponse> {
  return await apiRequest<APIResponse>(`${BASE_URL}/api/companies/blacklist/${encodeURIComponent(company)}`, {
    method: "PUT",
    headers: API_HEADERS,
  });
}

export async function updateCompanyFollowers(company: string, followers: number): Promise<APIResponse> {
  return await apiRequest<APIResponse>(`${BASE_URL}/api/companies/followers/${encodeURIComponent(company)}`, {
    method: "PUT",
    headers: API_HEADERS,
    body: JSON.stringify({ followers }),
  });
}

export function getRoleTypeFromString(roleType: string): RoleType {
  return roleType === "intern" ? "intern" : "newgrad";
}

export interface TagWithCount {
  id: number;
  name: string;
  job_count: number;
}

export async function getTagsWithCounts(): Promise<TagWithCount[]> {
  interface TagsResponse { tags: TagWithCount[]; }
  const data = await apiRequest<TagsResponse>(`${BASE_URL}/api/tracker/tags`);
  return data.tags;
}
