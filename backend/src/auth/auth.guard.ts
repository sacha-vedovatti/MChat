/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Admin guard
*/

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

type RequestWithUser = Request & {
    user?: {
        id: string;
        role: string;
    };
};

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<RequestWithUser>();

        if (request.user?.role !== 'ADMIN')
            throw new ForbiddenException('Admin access required');
        return true;
    }
}
