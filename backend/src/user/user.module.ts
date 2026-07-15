/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User Module
*/

import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/auth.guard';
import { PrismaService } from 'src/prisma.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, AdminGuard]
})
export class UserModule {}
