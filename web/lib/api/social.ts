/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Social API routes
*/

import { apiFetch } from "./client";

export function sendFriendRequest(userId: string) {
  return apiFetch<void>("/friends/requests", { method: "POST", body: JSON.stringify({ user_id: userId }) });
}

export function blockUser(userId: string) {
  return apiFetch<void>(`/users/${userId}/block`, { method: "POST" });
}

export function unblockUser(userId: string) {
  return apiFetch<void>(`/users/${userId}/block`, { method: "DELETE" });
}
