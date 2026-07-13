/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Application Service
*/

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): string {
    return 'OK';
  }
}
