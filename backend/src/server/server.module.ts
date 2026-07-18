/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Server Module
*/

import { Module } from "@nestjs/common";
import { ServerController } from "./server.controller";
import { ServerService } from "./server.service";
import { PrismaService } from "src/prisma.service";
import { AdminGuard } from "src/auth/auth.guard";

@Module({
    controllers: [ServerController],
    providers: [ServerService, PrismaService, AdminGuard]
})
export class ServerModule {}
