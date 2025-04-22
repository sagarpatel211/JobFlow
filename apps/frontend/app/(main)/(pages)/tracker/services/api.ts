import { format } from "date-fns";
import { Job, JobStatus, RoleType } from "@/types/job";
import { APIResponse, BackendJob, TrackerAPIResponse, AddJobResponse, UpdateJobResponse } from "@/types/api";
import { getStatusFromIndex } from "@/lib/constants";

const RAW = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE_URL = RAW.endsWith("/") ? RAW.slice(0, -1) : RAW;
const HEADERS = { "Content-Type": "application/json" };

export async function optimistic<T>(mutateLocal: () => void, apiCall: () => Promise<T>, rollback: () => void): Promise<T> {
  try {
    mutateLocal();
    return await apiCall();
  } catch (e) {
    rollback();
    throw e;
  }
}

function s(v: string | number) {
  return String(v);
}

function safeDate(d?: string | null) {
  if (!d) return format(new Date(), "yyyy-MM-dd");
  try {
    if (d.includes(".")) {
      const [day, month, year] = d.split(".").map(Number);
      return format(new Date(year, month - 1, day), "yyyy-MM-dd");
    }
    return format(new Date(d), "yyyy-MM-dd");
  } catch {
    return format(new Date(), "yyyy-MM-dd");
  }
}

async function req<T>(url: string, opt?: RequestInit): Promise<T> {
  const r = await fetch(url, opt);
  if (!r.ok) {
    let msg = "status " + String(r.status);
    try {
      const j = (await r.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await r.json()) as T;
}

export async function fetchTrackerData(params: URLSearchParams): Promise<TrackerAPIResponse> {
  return req(`${BASE_URL}/api/tracker?${params.toString()}`);
}

async function getJobs(): Promise<Job[]> {
  interface Raw {
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
    company_image_url?: string | null;
  }
  const d = await req<{ jobs: Raw[] }>(`${BASE_URL}/api/jobs`);
  return d.jobs.map((j) => ({
    id: j.id,
    company: j.company,
    title: j.title,
    link: j.link,
    postedDate: j.posted_date,
    status: j.status,
    role_type: j.role_type,
    priority: j.priority,
    archived: j.archived,
    statusIndex: 0,
    isModifying: false,
    deleted: false,
    atsScore: j.atsScore,
    tags: j.tags,
    notes: j.notes,
    followerCount: j.follower_count ? Number(j.follower_count) : 0,
    company_image_url: j.company_image_url,
  }));
}

export async function addJob(j: Job) {
  const bj: BackendJob = {
    company: { name: j.company },
    title: j.title,
    role_type: j.role_type ?? "newgrad",
    status: j.status ?? "nothing_done",
    posted_date: safeDate(j.postedDate),
    link: j.link,
    priority: j.priority,
    archived: j.archived,
    ats_score: j.atsScore || 0,
    tags: j.tags || [],
    notes: j.notes || "",
  };
  return req<AddJobResponse>(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ job: bj }),
  });
}

function patchToBackend(p: Partial<Job>): BackendJob {
  const b: BackendJob = {};
  if (p.company !== undefined) b.company = { name: p.company };
  if (p.title !== undefined) b.title = p.title;
  if (p.role_type !== undefined) b.role_type = p.role_type;
  if (p.status !== undefined || p.statusIndex !== undefined) {
    b.status = p.status ?? (p.statusIndex !== undefined ? getStatusFromIndex(p.statusIndex) : undefined);
  }
  if (p.postedDate !== undefined) b.posted_date = safeDate(p.postedDate);
  if (p.link !== undefined) b.link = p.link;
  if (p.priority !== undefined) b.priority = p.priority;
  if (p.archived !== undefined) b.archived = p.archived;
  if (p.atsScore !== undefined) b.ats_score = p.atsScore;
  if (p.tags !== undefined) b.tags = p.tags;
  if (p.notes !== undefined) b.notes = p.notes;
  return b;
}

export async function updateJob(id: number, p: Partial<Job>) {
  return req<UpdateJobResponse>(`${BASE_URL}/api/jobs/${s(id)}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({ job: patchToBackend(p) }),
  });
}

export async function archiveJob(id: number) {
  return req<APIResponse>(`${BASE_URL}/api/jobs/${s(id)}/archive`, {
    method: "PUT",
    headers: HEADERS,
  });
}

export async function togglePriorityJob(id: number) {
  return req<{ success: boolean; priority: boolean }>(`${BASE_URL}/api/jobs/${s(id)}/priority`, {
    method: "PUT",
    headers: HEADERS,
  });
}

export async function deleteJob(id: number) {
  return req<APIResponse>(`${BASE_URL}/api/jobs/${s(id)}/soft-delete`, {
    method: "PUT",
    headers: HEADERS,
  });
}

export async function unarchiveJob(id: number): Promise<APIResponse> {
  return req<APIResponse>(`${BASE_URL}/api/jobs/${String(id)}/unarchive`, {
    method: "PUT",
    headers: HEADERS,
  });
}

export async function restoreJob(id: number) {
  return req<APIResponse>(`${BASE_URL}/api/jobs/${s(id)}/restore`, {
    method: "PUT",
    headers: HEADERS,
  });
}

export async function permanentDeleteJob(id: number) {
  return req<APIResponse>(`${BASE_URL}/api/jobs/${s(id)}/permanent-delete`, {
    method: "DELETE",
    headers: HEADERS,
  });
}

export async function updateJobStatusArrow(id: number, d: number) {
  return req<APIResponse>(`${BASE_URL}/api/jobs/${s(id)}/status-arrow`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({ direction: d }),
  });
}

export async function deleteOlderThan(m: number) {
  return req<{ deleted_count: number }>(`${BASE_URL}/api/jobs/delete-older-than/${s(m)}`, { method: "DELETE", headers: HEADERS });
}

export async function removeDeadLinks() {
  return req<{ removed_count: number }>(`${BASE_URL}/api/jobs/remove-dead-links`, {
    method: "POST",
    headers: HEADERS,
  });
}

export async function archiveRejected() {
  return req<{ archived_count: number }>(`${BASE_URL}/api/jobs/archive-rejected`, {
    method: "POST",
    headers: HEADERS,
  });
}

export async function archiveAppliedOlderThan(m: number) {
  return req<{ archived_count: number }>(`${BASE_URL}/api/jobs/archive-applied-older-than/${s(m)}`, {
    method: "POST",
    headers: HEADERS,
  });
}

export async function markOldestAsPriority() {
  return req<{ marked_count: number }>(`${BASE_URL}/api/jobs/mark-oldest-as-priority`, { method: "POST", headers: HEADERS });
}

export async function startScrape() {
  return req<{ success: boolean }>(`${BASE_URL}/api/scrape`, {
    method: "POST",
    headers: HEADERS,
  });
}

export async function cancelScrape() {
  return req<{ success: boolean }>(`${BASE_URL}/api/scrape/cancel`, {
    method: "POST",
    headers: HEADERS,
  });
}

export async function getScrapeStatus() {
  return req<{ scraping: boolean; scrapeProgress: number; estimatedSeconds: number }>(`${BASE_URL}/api/scrape/status`);
}

async function getHealthStatus() {
  return req<{ isHealthy: boolean }>(`${BASE_URL}/api/health`);
}

export async function whitelistCompany(c: string) {
  return req<APIResponse>(`${BASE_URL}/api/companies/whitelist/${encodeURIComponent(c)}`, { method: "PUT", headers: HEADERS });
}

async function blacklistCompany(c: string) {
  return req<APIResponse>(`${BASE_URL}/api/companies/blacklist/${encodeURIComponent(c)}`, { method: "PUT", headers: HEADERS });
}

export async function updateCompanyFollowers(c: string, f: number) {
  return req<APIResponse>(`${BASE_URL}/api/companies/followers/${encodeURIComponent(c)}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({ followers: f }),
  });
}

function getRoleTypeFromString(r: string): RoleType {
  return r === "intern" ? "intern" : "newgrad";
}

export interface TagWithCount {
  id: number;
  name: string;
  job_count: number;
}

export async function getTagsWithCounts() {
  return req<{ tags: TagWithCount[] }>(`${BASE_URL}/api/tracker/tags`).then((d) => d.tags);
}

// Function to upload a company logo
async function uploadCompanyLogo(companyId: number, logoFile: File): Promise<{ success: boolean; image_url: string }> {
  const formData = new FormData();
  formData.append("logo", logoFile);

  return req<{ success: boolean; image_url: string }>(`${BASE_URL}/api/companies/logo/${String(companyId)}`, {
    method: "POST",
    body: formData,
  });
}

// Attachments
// Upload a resume or cover letter file for a job
export async function uploadJobAttachment(
  jobId: number,
  file: File,
  attachmentType: string,
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("attachment_type", attachmentType);
  const resp = await fetch(`${BASE_URL}/api/jobs/${String(jobId)}/attachment`, {
    method: "POST",
    body: formData,
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err);
  }
  // Safely parse backend response
  const raw: unknown = await resp.json();
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid attachment response");
  }
  const parsed = raw as Record<string, unknown>;
  const attachmentField = parsed["attachment"];
  if (typeof attachmentField !== "object" || attachmentField === null) {
    throw new Error("Missing attachment field");
  }
  const attachmentObj = attachmentField as Record<string, unknown>;
  const filenameValue = attachmentObj["filename"];
  if (typeof filenameValue !== "string") {
    throw new Error("Invalid filename in response");
  }
  // Get presigned URL for download
  const url = await getJobAttachmentUrl(jobId, attachmentType);
  return { url, filename: filenameValue };
}

// Fetch a presigned URL for an attachment
async function getJobAttachmentUrl(jobId: number, attachmentType: string): Promise<string> {
  const data = await req<{ url: string; filename: string }>(`${BASE_URL}/api/jobs/${String(jobId)}/attachment/${attachmentType}`);
  return data.url;
}
