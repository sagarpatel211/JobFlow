"use client";

// default to backend URL if environment variable is missing
const RAW = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE_URL = RAW.endsWith("/") ? RAW.slice(0, -1) : RAW;

async function req<T>(url: string, opt: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opt.headers as Record<string, string>),
  };
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(url, { ...opt, headers });
  if (!r.ok) {
    let msg = `status ${r.status.toString()}`;
    try {
      const j = (await r.json()) as { msg?: string; error?: string };
      if (j.msg) msg = j.msg;
      if (j.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await r.json()) as T;
}

export function register(email: string, password: string, name?: string): Promise<{ access_token: string }> {
  return req(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function login(email: string, password: string): Promise<{ access_token: string }> {
  return req(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// profile shape with onboarding data
export interface Profile {
  id: number;
  email: string;
  name: string;
  is_onboarded: boolean;
  onboarding_step: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  // email used in cover letters
  preferredEmail?: string;
  // settings fields
  university?: string;
  aboutMe?: string;
  openAIKey?: string;
  archiveDuration: string;
  deleteDuration: string;
  // tracking preferences
  leetcodeEnabled: boolean;
  behaviouralEnabled: boolean;
  jobsEnabled: boolean;
  systemDesignEnabled: boolean;
  // tracking goals
  leetcodeGoal: number;
  behaviouralGoal: number;
  jobsGoal: number;
  systemDesignGoal: number;
  // document URLs (if needed to show existing uploads)
  resumeUrl?: string;
  coverLetterUrl?: string;
  transcriptUrl?: string;
  latexUrl?: string;
  // profile picture URL
  profilePicUrl?: string;
  // job-automation preferences
  preferredJobTitles: string;
  preferredCompanies: string;
  autoApply: boolean;
  additionalNotes: string;
  // terms acceptance flag
  termsAccepted?: boolean;
}

/** Fetches current user profile including onboarding progress */
export function getProfile(): Promise<Profile> {
  return req(`${BASE_URL}/api/auth/profile`, { method: "GET" });
}

/** Persist one onboarding step's data to the server */
export function saveOnboard(data: Partial<Profile> & { step: number }): Promise<{ msg: string; onboarding_step: number }> {
  return req(`${BASE_URL}/api/auth/onboard`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Upload a document file to Minio via backend and return its storage key.
 * Expects multipart/form-data with field and file.
 */
export async function uploadDocument(
  field: "resume" | "coverLetter" | "transcript" | "latex",
  file: File,
): Promise<{ url: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const formData = new FormData();
  formData.append("field", field);
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/auth/upload-document`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Upload failed");
  }
  return (await res.json()) as { url: string };
}

function onboard(name: string): Promise<{ msg: string }> {
  return req(`${BASE_URL}/api/auth/onboard`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

/**
 * Update user profile settings and personal info.
 */
export function updateProfile(data: Partial<Profile>): Promise<{ success: boolean }> {
  return req(`${BASE_URL}/api/auth/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Fetch today's stats for the authenticated user
export function getStats(): Promise<Record<string, number>> {
  return req(`${BASE_URL}/api/stats`, { method: "GET" });
}

// Set or update a daily stat (clamped 1–10) for the authenticated user
export function setStat(stat_type: string, value: number): Promise<{ stat_type: string; value: number }> {
  return req(`${BASE_URL}/api/stats`, {
    method: "POST",
    body: JSON.stringify({ stat_type, value }),
  });
}
