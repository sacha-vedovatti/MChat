/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Client manager
*/

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function getApiUrl(path: string) {
  return `${API_URL}${path}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined")
    return null;
  return localStorage.getItem("mchat_token");
}

export function setToken(token: string) {
  localStorage.setItem("mchat_token", token);
}

export function clearToken() {
  localStorage.removeItem("mchat_token");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token)
    headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(getApiUrl(path), { ...options, headers, cache: "no-store" });
  const raw = await response.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    const message = typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : typeof data === "string" && data ? data : `Request failed (${response.status})`;
    if (response.status === 401 && typeof window !== "undefined")
      clearToken();
    throw new ApiError(response.status, message);
  }
  return data as T;
}
