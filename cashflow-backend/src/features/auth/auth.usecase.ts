import * as authRepo from '@features/auth/auth.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (data: any) => {
  const { username, email, password } = data;

  // 1. Kiểm tra username đã tồn tại chưa
  const existingUser = await authRepo.findUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists'); // Sau này ta sẽ đổi thành AppError chuẩn
  }

  // 2. Kiểm tra email (nếu có)
  if (email) {
    const existingEmail = await authRepo.findUserByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
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
    throw new Error('Invalid username or password');
  }

  // 2. So sánh mật khẩu người dùng nhập với Hash trong DB
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid username or password');
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