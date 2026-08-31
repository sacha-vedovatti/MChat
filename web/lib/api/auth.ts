/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Auth routes
*/

import { apiFetch, setToken } from "./client";
import type { LoginResponse, RegisterResponse, User } from "../types";

export async function login(email: string, password: string) {
  const result = await apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password })});

  setToken(result.token);
  return result;
}

export async function register(email: string, username: string, password: string) {
  const result = await apiFetch<RegisterResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email, username, password })});

  setToken(result.token);
  return result;
}

export function getMe() {
  return apiFetch<User>("/users/me");
}

export type UpdateProfileInput = Partial<{
  username: string;
  email: string;
  avatar_url: string | null;
  password: string;
}>;

export function updateProfile(input: UpdateProfileInput) {
  return apiFetch<User>("/users/me", { method: "PUT", body: JSON.stringify(input) });
}

export function deleteAccount(currentPassword: string) {
  return apiFetch<User>("/users/me", {
    method: "DELETE",
    body: JSON.stringify({ current_password: currentPassword }),
  });
}
