/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Authentication Service
*/

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export type RegisterBody = {
    email: string;
    name?: string;
    password: string;
}

export type LoginBody = {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {
    private readonly jwt_secret: string;

    constructor(private readonly prisma: PrismaService) {
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret)
            throw new Error('JWT_SECRET is not defined');
        this.jwt_secret = jwtSecret;
    }

    async generateToken(id: number)
    {
        return jwt.sign({ id }, this.jwt_secret, { expiresIn: '1h'});
    }

    async hashPassword(password: string): Promise<string>
    {
        const salt = await bcrypt.genSalt();

        return bcrypt.hash(password, salt);
    }

    async verifyEmail(email: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { email }});
        if (user) {
            return false;
        }
        return true;
    }

    async login(body: LoginBody): Promise<{ token: string }>
    {
        const user = await this.prisma.user.findUnique({ where: { email: body.email }});

        if (!user || !(await bcrypt.compare(body.password, user.password)))
            throw new UnauthorizedException('Invalid credentials');
        return await this.generateToken(user.id);
    }

    async register(body: RegisterBody): Promise<{ token: string }>
    {
        if (!(await this.verifyEmail(body.email)))
            throw new UnauthorizedException('User already exists');

        const hashedPassword = await this.hashPassword(body.password);
        const user = await this.prisma.user.create({ data: { email: body.email, password: hashedPassword, name: body.name }});
        const token = await this.generateToken(user.id);
        return { token };
    }

    async validate_token(token: string): Promise<any>
    {
        try {
            return jwt.verify(token, this.jwt_secret);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
