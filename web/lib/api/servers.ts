/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server API routes
*/

import { apiFetch } from "./client";
import type { Channel, Member, Role, Server } from "../types";

export function getServers() {
    return apiFetch<Array<Server & { channels: Channel[]; users: unknown[]; roles: Role[] }>>("/servers/me");
}

export function getServer(serverId: string) {
    return apiFetch<Server & { channels: Channel[]; users: unknown[]; roles: Role[] }>(`/servers/${serverId}`);
}

export function getChannels(serverId: string) {
    return apiFetch<Channel[]>(`/servers/${serverId}/channels`);
}

export function getMembers(serverId: string) {
    return apiFetch<Member[]>(`/servers/${serverId}/members`)
};

export function createServer(name: string) {
    return apiFetch<Server>("/servers", { method: "POST", body: JSON.stringify({ name })});
}

export function createChannel(serverId: string, name: string, description?: string) {
    return apiFetch<Channel>(`/servers/${serverId}/channels`, { method: "POST", body: JSON.stringify({ name, description })});
}

export function deleteServer(serverId: string) {
    return apiFetch<Server>(`/servers/${serverId}`, { method: 'DELETE' });
}

export function updateServer(serverId: string, name: string) {
    return apiFetch<Server>(`/servers/${serverId}`, { method: 'PUT', body: JSON.stringify({ name })});
}

export function deleteChannel(channelId: string) {
    return apiFetch<Channel>(`/channels/${channelId}`, { method: 'DELETE' });
}

export type UpdateChannelInput = {
    name?: string;
    description?: string;
}

export function updateChannel(channelId: string, input: UpdateChannelInput) {
    return apiFetch<Channel>(`/channels/${channelId}`, { method: 'PUT', body: JSON.stringify(input) });
}
