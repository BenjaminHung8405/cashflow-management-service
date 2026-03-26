import { AppError } from '@core/errors/AppError';
import { AuthRepository } from './auth.repository';

interface RegisterInput {
  username: string;
  email?: string;
  password: string;
}

interface LoginInput {
  username: string;
  password: string;
}

interface AuthOutput {
  id: string;
  username: string;
  email?: string | null;
  token?: string;
}

/**
 * Layer: Use Case (pure business logic)
 * Feature: Auth
 * Pure business logic - no Express req/res objects here
 */
export class AuthUseCase {
  private repository: AuthRepository = new AuthRepository();

  /**
   * Register a new user
   * Input: plain objects only (no Express req/res)
   * Output: plain objects or throw custom errors
   */
  async register(input: RegisterInput): Promise<AuthOutput> {
    // TODO: Validate password strength
    // TODO: Hash password using bcrypt
    // TODO: Generate JWT token

    const existingUser = await this.repository.findByUsername(input.username);
    if (existingUser) {
      throw new AppError('Username already exists', 409);
    }

    const user = await this.repository.create({
      username: input.username,
      email: input.email,
      passwordHash: 'hashed_password', // Replace with actual hash
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      token: 'jwt_token_here', // Replace with actual JWT
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthOutput> {
    // TODO: Verify password
    // TODO: Generate JWT token

    const user = await this.repository.findByUsername(input.username);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      token: 'jwt_token_here', // Replace with actual JWT
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<AuthOutput> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
