
// Definir as interfaces para as requisições e respostas de autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
