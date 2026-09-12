/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Messages & DirectMessages (DM) Routes
*/

import { apiFetch } from "./client";
import type { Conversation, DirectMessage, DirectMessagePage, Message, MessagePage } from "../types";

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

export function getConversations() {
  return apiFetch<Conversation[]>(`/dm`, { method: 'GET' });
}

export function createConversation(userId: string) {
  return apiFetch<Conversation>(`/dm/${userId}`, { method: 'POST' });
}

export function getDirectMessages(conversationId: string, page = 1, limit = 100) {
  return apiFetch<DirectMessagePage>(`/dm/${conversationId}/messages?page=${page}&limit=${limit}`);
}

export function updateDirectMessage(messageId: string, content: string) {
  return apiFetch<DirectMessage>(`/dm/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ content }) });
}

export function deleteDirectMessage(messageId: string) {
  return apiFetch<DirectMessage>(`/dm/messages/${messageId}`, { method: 'DELETE' });
}

export function sendDirectMessage(conversationId: string, content: string) {
  return apiFetch<DirectMessage>(`/dm/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
}
