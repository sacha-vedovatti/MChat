import { apiFetch } from "./client";
import type { Channel, Member, Role, Server } from "../types";

export function getServers() {
    return apiFetch<Array<Server & { channels: Channel[]; users: unknown[]; roles: Role[] }>>("/servers");
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
