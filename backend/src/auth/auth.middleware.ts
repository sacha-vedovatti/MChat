/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Authentication middleware
*/

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor (private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const auth_header = req.headers['authorization'];
    if (!auth_header)
      throw new UnauthorizedException('Authorization header is missing');

    const token = auth_header.split(' ')[1];
    if (!token)
      throw new UnauthorizedException('Token is missing');

    try {
      const payload = await this.authService.validate_token(token);

      req['user'] = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
