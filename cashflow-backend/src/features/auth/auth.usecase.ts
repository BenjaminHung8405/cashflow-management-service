import { AppError } from '@core/errors/AppError';
import * as authRepo from '@features/auth/auth.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
};

type UpdateProfileInput = {
  email?: string;
};

export const registerUser = async (data: any) => {
  const { username, email, password } = data;

  // 1. Kiểm tra username đã tồn tại chưa
  const existingUser = await authRepo.findUserByUsername(username);
  if (existingUser) {
    throw new AppError('Username already exists', 409);
  }

  // 2. Kiểm tra email (nếu có)
  if (email) {
    const existingEmail = await authRepo.findUserByEmail(email);
    if (existingEmail) {
      throw new AppError('Email already exists', 409);
    }
  }

  // 3. Băm (Hash) mật khẩu
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 4. Lưu vào DB
  const newUser = await authRepo.createUser({ username, email, passwordHash });
  return newUser;
};

export const loginUser = async (data: any) => {
  const { username, password } = data;

  // 1. Tìm user trong DB
  const user = await authRepo.findUserByUsername(username);
  if (!user) {
    // Bảo mật: Dù sai username hay sai pass đều trả chung 1 câu để chống hacker dò tìm username
    throw new AppError('Invalid username or password', 401);
  }

  // 2. So sánh mật khẩu người dùng nhập với Hash trong DB
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid username or password', 401);
  }

  // 3. Tạo JWT Token
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  // Payload của token chứa id để sau này các API khác biết ai đang gọi
  const token = jwt.sign({ id: user.id, username: user.username }, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });

  // 4. Loại bỏ passwordHash trước khi trả data về cho Frontend
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const getUserById = async (userId: string) => {
  const user = await authRepo.getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const changePassword = async (userId: string, data: ChangePasswordInput) => {
  const { oldPassword, newPassword } = data;

  if (!oldPassword || !newPassword) {
    throw new AppError('Old password and new password are required', 400);
  }

  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isOldPasswordValid) {
    throw new AppError('Incorrect old password', 400);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new AppError('New password must be different from the old password', 400);
  }

  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  return authRepo.updatePassword(userId, newPasswordHash);
};

export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  const { email } = data;

  if (email === undefined) {
    throw new AppError('Email is required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) {
    throw new AppError('Invalid email format', 400);
  }

  const existingUser = await authRepo.findUserByEmail(normalizedEmail);
  if (existingUser && existingUser.id !== userId) {
    throw new AppError('This email is already in use by another account', 409);
  }

  return authRepo.updateProfile(userId, { email: normalizedEmail });
};
