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

export function getProfile(): Promise<{ id: number; email: string; name: string; is_onboarded: boolean }> {
  return req(`${BASE_URL}/api/auth/profile`, { method: "GET" });
}

function onboard(name: string): Promise<{ msg: string }> {
  return req(`${BASE_URL}/api/auth/onboard`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}
