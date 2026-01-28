import { Injectable } from '@nestjs/common';
import type { User } from '@nx-shay/shared';
import { randomUUID } from 'crypto';

interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

@Injectable()
export class UsersService {
  private users: StoredUser[] = [];

  async create(username: string, passwordHash: string): Promise<StoredUser> {
    const user: StoredUser = {
      id: randomUUID(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  async findByUsername(username: string): Promise<StoredUser | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    return this.users.find((u) => u.id === id);
  }

  toPublicUser(stored: StoredUser): User {
    return {
      id: stored.id,
      username: stored.username,
      createdAt: stored.createdAt,
    };
  }
}
