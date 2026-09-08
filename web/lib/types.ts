/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Types definition
*/

export type User = { 
    id: string;
    email: string;
    username: string;
    avatar_url: string | null
}

export type Server = {
    id: string;
    owner_id: string;
    name: string;
    created_at: string
}

export type Channel = {
    id: string;
    server_id: string;
    name: string;
    description: string | null;
    created_at: string
}

export type Role = {
    id: number;
    server_id: string;
    name: string;
    color: string;
    permissions: string[];
    is_default: boolean;
    position: number;
    created_at: string
}

export type Member = {
    user: User;
    roles: Role[];
    joined_at: string
}

export type Message = {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    created_at: string
}

export type MessagePage = {
    items: Message[];
    page: number;
    limit: number;
    total: number
}

export type Invitation = {
    created_at: string;
    created_by: string;
    expires_at: string;
    invite_path: string;
    server_id: string;
    token: string;
}

export type LoginResponse = {
    token: string;
    id: string
}

export type RegisterResponse = {
    token: string
}

export type CreateServerInput = {
    name: string
}

export type CreateChannelInput = {
    name: string;
    description?: string
}
