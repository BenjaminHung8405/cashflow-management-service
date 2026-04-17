import { AppError } from "@core/errors/AppError";
import { Prisma } from "@prisma/client";
import * as authRepo from "@features/auth/auth.repository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
};

type RegisterInput = {
  username?: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateProfileInput = {
  email?: string;
  telegramChatId?: string | null;
};

const normalizeEmail = (email: string): string => {
  return email.normalize("NFKC").trim().toLowerCase();
};

const ensureValidEmail = (email: string): void => {
  if (!email.includes("@")) {
    throw new AppError("Invalid email format", 400);
  }
};

const isUniqueConstraintError = (
  error: unknown,
  keywords: string[],
): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  const targetText = Array.isArray(target)
    ? target.join(",").toLowerCase()
    : String(target ?? "").toLowerCase();

  return keywords.some((keyword) => targetText.includes(keyword.toLowerCase()));
};

export const registerUser = async (data: RegisterInput) => {
  const { username, email, password } = data;

  const normalizedEmail = normalizeEmail(email);
  ensureValidEmail(normalizedEmail);

  const providedUsername = username?.trim();
  let resolvedUsername = providedUsername;

  if (!resolvedUsername) {
    const [emailLocalPart] = normalizedEmail.split("@");
    resolvedUsername = (emailLocalPart || "user").slice(0, 50);
    if (!resolvedUsername) {
      resolvedUsername = "user";
    }
  }

  if (resolvedUsername.length > 50) {
    resolvedUsername = resolvedUsername.slice(0, 50);
  }

  // 1. Kiểm tra email đã tồn tại chưa
  const existingEmail = await authRepo.findUserByEmail(normalizedEmail);
  if (existingEmail) {
    throw new AppError("Email already exists", 409);
  }

  if (providedUsername) {
    const existingUsername =
      await authRepo.findUserByUsername(resolvedUsername);
    if (existingUsername) {
      throw new AppError("Username already exists", 409);
    }
  } else {
    const baseUsername = resolvedUsername;
    let suffix = 1;
    while (await authRepo.findUserByUsername(resolvedUsername)) {
      const suffixText = `_${suffix}`;
      resolvedUsername = `${baseUsername.slice(0, 50 - suffixText.length)}${suffixText}`;
      suffix += 1;
    }
  }

  // 2. Băm (Hash) mật khẩu
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 3. Lưu vào DB
  try {
    const newUser = await authRepo.createUser({
      username: resolvedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    return newUser;
  } catch (error) {
    if (isUniqueConstraintError(error, ["email", "users_email"])) {
      throw new AppError("Email already exists", 409);
    }

    if (isUniqueConstraintError(error, ["username", "users_username"])) {
      throw new AppError("Username already exists", 409);
    }

    throw error;
  }
};

export const loginUser = async (data: LoginInput) => {
  const { email, password } = data;

  const normalizedEmail = normalizeEmail(email);

  // 1. Tìm user trong DB
  const user = await authRepo.findUserByEmail(normalizedEmail);
  if (!user) {
    // Bảo mật: Dù sai email hay sai pass đều trả chung 1 câu để chống hacker dò tìm email
    throw new AppError("Invalid email or password", 401);
  }

  // 2. So sánh mật khẩu người dùng nhập với Hash trong DB
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // 3. Tạo JWT Token
  const secret = process.env.JWT_SECRET || "fallback_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  // Payload của token chứa id để sau này các API khác biết ai đang gọi
  const token = jwt.sign({ id: user.id, email: user.email }, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
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
    throw new AppError("User not found", 404);
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const changePassword = async (
  userId: string,
  data: ChangePasswordInput,
) => {
  const { oldPassword, newPassword } = data;

  if (!oldPassword || !newPassword) {
    throw new AppError("Old password and new password are required", 400);
  }

  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isOldPasswordValid = await bcrypt.compare(
    oldPassword,
    user.passwordHash,
  );
  if (!isOldPasswordValid) {
    throw new AppError("Incorrect old password", 400);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new AppError(
      "New password must be different from the old password",
      400,
    );
  }

  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  return authRepo.updatePassword(userId, newPasswordHash);
};

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput,
) => {
  const { email, telegramChatId } = data;

  if (email === undefined && telegramChatId === undefined) {
    throw new AppError("At least one field is required to update profile", 400);
  }

  let normalizedEmail: string | undefined;
  if (email !== undefined) {
    normalizedEmail = normalizeEmail(email);
    ensureValidEmail(normalizedEmail);

    const existingUser = await authRepo.findUserByEmail(normalizedEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new AppError(
        "This email is already in use by another account",
        409,
      );
    }
  }

  let normalizedTelegramChatId: string | null | undefined;
  if (telegramChatId !== undefined) {
    if (telegramChatId === null) {
      normalizedTelegramChatId = null;
    } else {
      const trimmed = telegramChatId.trim();
      if (trimmed.length === 0) {
        normalizedTelegramChatId = null;
      } else {
        normalizedTelegramChatId = trimmed;
      }
    }
  }

  try {
    return authRepo.updateProfile(userId, {
      ...(normalizedEmail !== undefined && { email: normalizedEmail }),
      ...(normalizedTelegramChatId !== undefined && {
        telegramChatId: normalizedTelegramChatId,
      }),
    });
  } catch (error) {
    if (isUniqueConstraintError(error, ["email", "users_email"])) {
      throw new AppError(
        "This email is already in use by another account",
        409,
      );
    }

    throw error;
  }
};
