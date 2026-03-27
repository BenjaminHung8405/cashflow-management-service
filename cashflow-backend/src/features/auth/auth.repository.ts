import type { Prisma, User } from '@prisma/client';

import { prisma } from '../../core/config/database';

type CreateUserInput = {
  username: string;
  email?: string;
  passwordHash: string;
};

type PublicUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    email: true;
    createdAt: true;
  };
}>;

export const findUserByUsername = async (username: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const getUserById = async (id: string): Promise<User | null> => {
  return findUserById(id);
};

export const createUser = async (data: CreateUserInput): Promise<PublicUser> => {
  return prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });
};

export class AuthRepository {
  async findByUsername(username: string): Promise<User | null> {
    return findUserByUsername(username);
  }

  async findByEmail(email: string): Promise<User | null> {
    return findUserByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return findUserById(id);
  }

  async create(data: CreateUserInput): Promise<PublicUser> {
    return createUser(data);
  }
}
