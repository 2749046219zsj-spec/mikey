import { AuthError } from '../types/auth';

export class AppError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'AppError';
  }
}

export function handleAuthError(error: any): AuthError {
  if (error?.message) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    status: 500,
  };
}

export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  WEAK_PASSWORD: 'Password must be at least 6 characters',
  NETWORK_ERROR: 'Network error. Please check your connection',
  UNAUTHORIZED: 'You do not have permission to perform this action',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  USER_NOT_FOUND: 'User not found',
  INVALID_EMAIL: 'Please enter a valid email address',
} as const;
