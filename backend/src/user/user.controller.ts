/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User Controller
*/

import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/auth.guard';
import { UserService } from './user.service';

type CreateUserBody = {
    email: string;
    username: string;
    password: string;
    avatar_url?: string;
};

type UpdateUserBody = {
    email?: string;
    username?: string;
    password?: string;
    avatar_url?: string;
};

type RequestWithUser = Request & {
    user?: {
        id: string;
    };
};

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    /// GET /users/me
    @Get('me')
    getMe(@Req() req: RequestWithUser) {
        return this.userService.getMe(req.user!.id);
    }

    /// PUT /users/me
    @Put('me')
    updateMe(@Req() req: RequestWithUser, @Body() body: UpdateUserBody) {
        return this.userService.updateMe(req.user!.id, body);
    }

    /// GET /users
    @UseGuards(AdminGuard)
    @Get()
    getUsers() {
        return this.userService.getAll();
    }

    /// GET /users/{userId}
    @UseGuards(AdminGuard)
    @Get(':userId')
    getUser(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.userService.getUser(userId);
    }

    /// POST /users
    @UseGuards(AdminGuard)
    @Post()
    createUser(@Body() body: CreateUserBody) {
        return this.userService.createUser(body);
    }

    /// PUT /users/{userId}
    @UseGuards(AdminGuard)
    @Put(':userId')
    updateUser(@Param('userId', ParseUUIDPipe) userId: string, @Body() body: UpdateUserBody) {
        return this.userService.updateUser(userId, body);
    }

    /// DELETE /users/{userId}
    @UseGuards(AdminGuard)
    @Delete(':userId')
    deleteUser(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.userService.deleteUser(userId);
    }
}
