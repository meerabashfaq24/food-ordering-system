export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface AuthRequestUser {
  id: string;
  role: UserRole;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}