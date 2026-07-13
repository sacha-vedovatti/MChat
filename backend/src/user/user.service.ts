/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** User Service
*/

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

type CreateUserInput = {
    email: string;
    name?: string;
    password: string;
};

type UpdateUserInput = {
    email?: string;
    name?: string;
    password?: string;
};

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async getAll() {
        const users = await this.prisma.user.findMany({
            select: { id: true, email: true, name: true }
        });

        return users;
    }

    async getUser(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true }
        });

        return user;
    }

    async createUser(input: CreateUserInput) {
        const user = await this.prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                password: input.password
            },
            select: { id: true, email: true, name: true }
        });

        return user;
    }

    async updateUser(userId: number, input: UpdateUserInput) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                email: input.email,
                name: input.name,
                password: input.password
            },
            select: { id: true, email: true, name: true }
        });

        return user;
    }

    async deleteUser(userId: number) {
        const user = await this.prisma.user.delete({
            where: { id: userId },
            select: { id: true, email: true, name: true }
        });

        return user;
    }
}
