/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Roles API routes
*/

import { apiFetch } from "./client";
import { Role } from "../types";

export function getRoles(serverId: string) {
    return apiFetch<Role[]>(`/servers/${serverId}/roles`, { method: 'GET' });
}

export type CreateRoleInput = {
    name: string;
    color?: string;
    permissions?: string[]
}

export function createRole(serverId: string, input: CreateRoleInput) {
    return apiFetch<Role>(`/servers/${serverId}/roles`, { method: 'POST', body: JSON.stringify(input) });
}

export type UpdateRoleInput = Partial<{
    name: string;
    color: string;
    permissions: string[];
    position: number;
    is_default: boolean
}>;

export function updateRole(serverId: string, roleId: number, input: UpdateRoleInput) {
    return apiFetch<Role>(`/servers/${serverId}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deleteRole(serverId: string, roleId: number) {
    return apiFetch<Role>(`/servers/${serverId}/roles/${roleId}`, { method: 'DELETE' });
}

export function setMemberRole(serverId: string, userId: string, roleId: number) {
    return apiFetch<Role>(`/servers/${serverId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({role_id: roleId}) });
}
