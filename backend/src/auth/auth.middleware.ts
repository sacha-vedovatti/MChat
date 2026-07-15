/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Authentication middleware
*/

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { Request, Response, NextFunction } from 'express'

type RequestWithUser = Request & {
  user?: {
    id: string;
    role: string;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor (
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const auth_header = req.headers['authorization'];
    if (!auth_header)
      throw new UnauthorizedException('Authorization header is missing');

    const token = auth_header.split(' ')[1];
    if (!token)
      throw new UnauthorizedException('Token is missing');

    try {
      const payload = await this.authService.validate_token(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, role: true }});

      if (!user)
        throw new UnauthorizedException('Invalid or expired token');
      req['user'] = user;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
