/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server Controller
*/

import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ServerService } from "./server.service";
import { AdminGuard } from "src/auth/auth.guard";

type RequestWithUser = Request & {
    user: {
        id: string;
        role: string;
    };
};

type CreateServerBody = {
    name: string
}

type UpdateServerBody = {
    name?: string
}

type CreateChannelBody = {
    name: string,
    description?: string
}

@Controller(['server', 'servers'])
export class ServerController {
    constructor (private readonly serverService: ServerService) { }

    /// GET /server
    @UseGuards(AdminGuard)
    @Get()
    getServers() {
        return this.serverService.getAll();
    }

    /// GET /server/{id}
    @UseGuards(AdminGuard)
    @Get(':serverId')
    getServer(@Param('serverId', ParseUUIDPipe) serverId: string) {
        return this.serverService.getServer(serverId);
    }

    /// POST /server
    @UseGuards(AdminGuard)
    @Post()
    createServer(@Req() req: RequestWithUser, @Body() body: CreateServerBody) {
        return this.serverService.createServer(req.user.id, body);
    }

    /// PUT /server/{id}
    @UseGuards(AdminGuard)
    @Put(':serverId')
    updateServer(@Param('serverId', ParseUUIDPipe) serverId: string, @Body() body: UpdateServerBody) {
        return this.serverService.updateServer(serverId, body);
    }

    /// DELETE /server/{id}
    @UseGuards(AdminGuard)
    @Delete(':serverId')
    deleteServer(@Param('serverId', ParseUUIDPipe) serverId: string) {
        return this.serverService.deleteServer(serverId);
    }

    /// GET /servers/{id}/channels
    @UseGuards(AdminGuard)
    @Get(':serverId/channels')
    getServerChannels(@Param('serverId', ParseUUIDPipe) serverId: string) {
        return this.serverService.getServerChannels(serverId);
    }

    /// POST /servers/{id}/channels
    @Post(':serverId/channels')
    createChannel(@Param('serverId', ParseUUIDPipe) serverId: string, @Body() body: CreateChannelBody) {
        return this.serverService.createChannel(serverId, body);
    }
}
