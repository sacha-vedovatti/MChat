/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Members API Routes
*/

import { Member } from "../types"
import { apiFetch } from "./client"

export function getMembers(serverId: string) {
    return apiFetch<Member[]>(`/servers/${serverId}/members`)
};

export function joinServer(serverId: string) {
    return apiFetch<Member>(`/servers/${serverId}/member`, { method: 'POST' });
}

export function updateMemberRoles(serverId: string, userId: string, role_ids: number[]) {
    return apiFetch<Member>(`/servers/${serverId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role_ids }) });
}

export function kickMember(serverId: string, userId: string) {
    return apiFetch<Member>(`/servers/${serverId}/members/${userId}`, { method: 'DELETE' });
}

export function banMember(serverId: string, userId: string) {
    return apiFetch<void>(`/servers/${serverId}/bans/${userId}`, { method: 'POST' });
}
