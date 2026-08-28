import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export type AuthenticatedRequest = Request & { user: AuthenticatedUser; cookies?: Record<string, string> };
