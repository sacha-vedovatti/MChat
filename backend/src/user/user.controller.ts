/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User Controller
*/

import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';

type CreateUserBody = {
    email: string;
    username: string;
    password: string;
};

type UpdateUserBody = {
    email?: string;
    username?: string;
    password?: string;
};

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    /// GET /users
    @Get()
    getUsers() {
        return this.userService.getAll();
    }

    /// GET /users/{userId}
    @Get(':userId')
    getUser(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.userService.getUser(userId);
    }

    /// POST /users
    @Post()
    createUser(@Body() body: CreateUserBody) {
        return this.userService.createUser(body);
    }

    /// PUT /users/{userId}
    @Put(':userId')
    updateUser(@Param('userId', ParseUUIDPipe) userId: string, @Body() body: UpdateUserBody) {
        return this.userService.updateUser(userId, body);
    }

    /// DELETE /users/{userId}
    @Delete(':userId')
    deleteUser(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.userService.deleteUser(userId);
    }
}
