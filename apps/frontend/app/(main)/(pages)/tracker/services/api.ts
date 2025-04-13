import { Job, RoleType, JobStatus, Folder } from "@/types/job";
import {
  APIResponse,
  BackendJob,
  TrackerAPIResponse,
  AddJobResponse,
  UpdateJobResponse,
  GetJobsResponse,
  TagsResponse,
  FoldersResponse,
} from "@/types/api";
import { format } from "date-fns";

const BASE_URL_RAW: string = process.env.NEXT_PUBLIC_API_URL ?? "";
// Remove trailing slash if present to avoid double slashes in API URLs
const BASE_URL: string = BASE_URL_RAW.endsWith("/") ? BASE_URL_RAW.slice(0, -1) : BASE_URL_RAW;

/**
 * Validates and formats a date string in dd.MM.yyyy format
 * If the date is not valid, returns today's date in dd.MM.yyyy format
 */
function validateDateString(dateStr: string | undefined | null): string {
  if (!dateStr) {
    // Default to today if no date provided
    return format(new Date(), "dd.MM.yyyy");
  }

  try {
    // Try to parse the date string
    if (dateStr.includes(".")) {
      // Format is already dd.MM.yyyy - validate it
      const [day, month, year] = dateStr.split(".").map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
      // Return the properly formatted version to ensure consistency
      return format(date, "dd.MM.yyyy");
    } else {
      // Try to parse as a JavaScript Date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
      return format(date, "dd.MM.yyyy");
    }
  } catch (error) {
    console.error("Date validation error:", error);
    // Default to today on error
    return format(new Date(), "dd.MM.yyyy");
  }
}

/**
 * Fetches tracker data with the provided parameters
 */
export async function fetchTrackerData(params: URLSearchParams): Promise<TrackerAPIResponse> {
  const response: Response = await fetch(`${BASE_URL}/api/tracker?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tracker data");
  }
  const data = (await response.json()) as TrackerAPIResponse;

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch tracker data");
  }

  return data;
}

/**
 * Gets all jobs
 */
export async function getJobs(): Promise<Job[]> {
  const response = await fetch(`${BASE_URL}/api/jobs`);

  if (!response.ok) {
    throw new Error("Failed to get jobs");
  }

  const data = (await response.json()) as unknown;
  const typedData = data as GetJobsResponse;

  if (!typedData.jobs || !Array.isArray(typedData.jobs)) {
    throw new Error("Invalid response format from jobs API");
  }

  return typedData.jobs.map((job) => ({
    ...job,
    postedDate: job.posted_date,
    status: job.status as JobStatus,
    role_type: job.role_type as RoleType,
  }));
}

/**
 * Gets all available tags
 */
export async function getTags(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/api/tracker/tags`);

  if (!response.ok) {
    throw new Error("Failed to get tags");
  }

  const data = (await response.json()) as unknown;
  const typedData = data as TagsResponse;

  // Handle both response formats
  if (!typedData.tags || !Array.isArray(typedData.tags)) {
    return []; // Return empty array if tags are missing or not an array
  }

  return typedData.tags.map((tag) => tag.name);
}

/**
 * Gets all available folders
 */
export async function getFolders(): Promise<Folder[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/jobs/folders`);

    if (!response.ok) {
      throw new Error(`Failed to get folders: ${response.status}`);
    }

    const data = await response.json();
    const typedData = data as FoldersResponse;

    if (!typedData.success || !typedData.folders || !Array.isArray(typedData.folders)) {
      return []; // Return empty array if folders are missing or not an array
    }

    return typedData.folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
    }));
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : String(error));
    // Return empty array to prevent UI errors
    return [];
  }
}

/**
 * Adds a new job
 */
export async function addJob(job: Job): Promise<AddJobResponse> {
  // Convert frontend job format to backend format
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
    folders: job.folders || [],
    notes: job.notes || "",
  };

  const response: Response = await fetch(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job: backendJob }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIResponse;
    throw new Error(errorData.error || "Failed to add job");
  }

  return (await response.json()) as AddJobResponse;
}

/**
 * Updates an existing job
 */
export async function updateJob(id: number, job: Partial<Job>): Promise<UpdateJobResponse> {
  // Convert frontend job format to backend format
  const backendJob: BackendJob = {};

  if (job.company !== undefined) backendJob.company = { name: job.company };
  if (job.title !== undefined) backendJob.title = job.title;
  if (job.role_type !== undefined) {
    backendJob.role_type = job.role_type;
  }
  if (job.statusIndex !== undefined || job.status !== undefined) {
    backendJob.status = job.status || (job.statusIndex !== undefined ? getStatusFromIndex(job.statusIndex) : undefined);
  }
  if (job.postedDate !== undefined) backendJob.posted_date = validateDateString(job.postedDate);
  if (job.link !== undefined) backendJob.link = job.link;
  if (job.priority !== undefined) backendJob.priority = job.priority;
  if (job.archived !== undefined) backendJob.archived = job.archived;
  if (job.atsScore !== undefined) backendJob.ats_score = job.atsScore;
  if (job.tags !== undefined) backendJob.tags = job.tags;
  if (job.folders !== undefined) backendJob.folders = job.folders;
  if (job.notes !== undefined) backendJob.notes = job.notes;

  const response: Response = await fetch(`${BASE_URL}/api/jobs/${String(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job: backendJob }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIResponse;
    throw new Error(errorData.error || "Failed to update job");
  }

  return (await response.json()) as UpdateJobResponse;
}

/**
 * Archives a job
 */
export async function archiveJob(id: number): Promise<APIResponse> {
  const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/archive`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIResponse;
    throw new Error(errorData.error || "Failed to archive job");
  }

  return (await response.json()) as APIResponse;
}

/**
 * Toggles a job's priority status
 */
export async function togglePriorityJob(id: number): Promise<{ success: boolean; priority: boolean }> {
  const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/priority`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIResponse;
    throw new Error(errorData.error || "Failed to toggle priority");
  }

  return (await response.json()) as { success: boolean; priority: boolean };
}

/**
 * Deletes a job
 */
export async function deleteJob(id: number): Promise<APIResponse> {
  const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/soft-delete`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIResponse;
    throw new Error(errorData.error || "Failed to delete job");
  }

  return (await response.json()) as APIResponse;
}

/**
 * Updates a job's status using the arrow endpoint
 */
export async function updateJobStatusArrow(id: number, direction: number): Promise<APIResponse> {
  const response = await fetch(`${BASE_URL}/api/jobs/${String(id)}/status-arrow`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIResponse;
    throw new Error(errorData.error || "Failed to update job status");
  }

  return (await response.json()) as APIResponse;
}

/**
 * Bulk action: Delete jobs older than specified months
 */
export async function deleteOlderThan(months: number): Promise<{ deleted_count: number }> {
  const response = await fetch(`${BASE_URL}/api/jobs/delete-older-than/${String(months)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error || "Failed to delete old data");
  }

  return (await response.json()) as { deleted_count: number };
}

/**
 * Utility function to convert status index to status string
 */
export function getStatusFromIndex(statusIndex: number): JobStatus {
  const statuses: JobStatus[] = ["nothing_done", "applying", "applied", "OA", "interview", "offer", "rejected"];
  return statusIndex >= 0 && statusIndex < statuses.length ? statuses[statusIndex] : "nothing_done";
}

/**
 * Utility function to convert role_type to proper format
 */
export function getRoleTypeFromString(roleType: string): RoleType {
  return roleType === "intern" ? "intern" : "newgrad";
}
