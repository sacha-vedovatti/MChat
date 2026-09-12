/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Users API routes
*/

import { apiFetch } from "./client";
import type { User } from "../types";

export function searchUsers(query: string) {
  return apiFetch<User[]>(`/users/search?query=${encodeURIComponent(query)}`);
}
