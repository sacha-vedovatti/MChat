/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Authentication Controller
*/

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginBody, RegisterBody } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor (private authService: AuthService) {}

    /// POST /auth/register
    @Post('register')
    async register(@Body() body: RegisterBody) {
        return this.authService.register(body);
    }

    /// POST /auth/login
    @Post('login')
    async login(@Body() body: LoginBody) {
        return this.authService.login(body);
    }
}
