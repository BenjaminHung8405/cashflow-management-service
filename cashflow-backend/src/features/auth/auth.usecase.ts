import * as authRepo from '@features/auth/auth.repository';
import bcrypt from 'bcrypt';

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