/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Social API Route
*/

import { BlockedUser, Friend, FriendRequest, FriendResponse } from "../types";
import { apiFetch } from "./client";

export function getFriends() {
    return apiFetch<Friend[]>(`/friends`, { method: 'GET' });
}

export function getFriendRequests() {
    return apiFetch<FriendRequest[]>(`/friends/requests`, { method: 'GET' });
}

export function deleteFriend(userId: string) {
    return apiFetch<FriendResponse>(`/friends/${userId}`, { method: 'DELETE' });
}

export function sendFriendRequest(user_id: string) {
    return apiFetch<FriendResponse>(`/friends/requests`, { method: 'POST', body: JSON.stringify({ user_id }) });
}

export function denyRequest(requestId: string) {
    return apiFetch<FriendResponse>(`/friends/requests/${requestId}`, { method: 'DELETE' });
}

export function acceptRequest(requestId: string) {
    return apiFetch<FriendResponse>(`/friends/requests/${requestId}/accept`, { method: 'POST' });
}

export function getBlockedUsers() {
    return apiFetch<BlockedUser[]>(`/blocks`, { method: 'GET' });
}

export function blockUser(userId: string) {
    return apiFetch<BlockedUser>(`/blocks/${userId}`, { method: 'POST' });
}

export function unblockUser(userId: string) {
    return apiFetch<BlockedUser>(`/blocks/${userId}`, { method: 'DELETE' });
}
