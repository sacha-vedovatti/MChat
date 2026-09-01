/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Messages
*/

import { apiFetch } from "./client";
import type { Message, MessagePage } from "../types";

export function getMessages(channelId: string, page = 1, limit = 100) {
  return apiFetch<MessagePage>(`/channels/${channelId}/messages?page=${page}&limit=${limit}`);
}

export function sendMessage(channelId: string, content: string) {
  return apiFetch<Message>(`/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify({ content })});
}

export function deleteMessage(messageId: string) {
  return apiFetch<Message>(`/messages/${messageId}`, { method: "DELETE" });
}

export function updateMessage(messageId: string, content: string) {
  return apiFetch<Message>(`/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({content}) });
}
