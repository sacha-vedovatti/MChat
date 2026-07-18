/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server Service
*/

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

type CreateServerInput = {
    name: string
}

type UpdateServerInput = {
    name?: string
}

type CreateChannelInput = {
    name: string,
    description?: string
}

type UpdateChannelInput = {
    name?: string,
    description?: string
}

@Injectable()
export class ServerService {
    constructor(private readonly prisma: PrismaService) { }

    async getAll() {
        const servers = await this.prisma.server.findMany({
            select: { id: true, name: true, created_at: true, channels: true, participants: true, roles: true }
        });

        return servers;
    }

    async getServer(serverId: string) {
        const server = await this.prisma.server.findUnique({
            where: { id: serverId },
            select: { id: true, name: true, created_at: true, channels: true, participants: true, roles: true }
        });

        if (!server)
            throw new NotFoundException('Server not found.');
        return server;
    }

    async createServer(userId: string, input: CreateServerInput) {
        const server = await this.prisma.server.create({
            data: { owner_id: userId, name: input.name }
        });
        const server_user = await this.prisma.serverUser.create({
            data: { server_id: server.id, user_id: userId }
        });

        return server;
    }

    async updateServer(serverId: string, input: UpdateServerInput) {
        const server = await this.prisma.server.update({
            where: { id: serverId },
            data: { name: input.name },
            select: { id: true, name: true, created_at: true, channels: true, participants: true, roles: true }
        });

        if (!server)
            throw new NotFoundException('Server not found.');
        return server;
    }

    async deleteServer(serverId: string) {
        const server = await this.prisma.server.delete({
            where: { id: serverId },
            select: { id: true, name: true }
        });

        if (!server)
            throw new NotFoundException('Server not found.');
        return server;
    }

    async getServerChannels(serverId: string) {
        const server = await this.prisma.server.findUnique({
            where: { id: serverId },
            select: {
                id: true,
                channels: {
                    select: { id: true, name: true, description: true, created_at: true, },
                    orderBy: { created_at: 'asc' },
                }
            }
        });

        if (!server)
            throw new NotFoundException('Server not found.');
        return server.channels;
    }

    async createChannel(serverId: string, input: CreateChannelInput) {
        const server = await this.prisma.server.findUnique({ where: { id: serverId }});
        if (!server)
            throw new NotFoundException('Server not found.');

        const channel = await this.prisma.channel.create({
            data: { server_id: serverId, name: input.name, description: input.description },
            select: { server_id: true, name: true, description: true, created_at: true }
        });
        return channel;
    }
}