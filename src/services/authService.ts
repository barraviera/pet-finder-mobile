
// O serviço será responsável por fazer login, registrar novos usuários, consultar o usuário autenticado e encerrar a sessão.
import * as SecureStore from 'expo-secure-store';

import { api, TOKEN_KEY } from './api';

import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth';

// async e await
// Uma chamada HTTP demora um tempo para receber uma resposta. Por isso, a função é assíncrona.
// O await aguarda o resultado da chamada antes de executar as próximas instruções daquela função.
// api.post()
// Envia uma requisição HTTP POST com os dados informados. Neste caso, o Axios serializa o objeto em JSON.
// O corpo enviado ao backend terá este formato:
// {
//   "email": "usuario@exemplo.com",
//   "password": "senha12345"
// }
// Esse JSON corresponde ao nosso LoginRequest Java.
// Promise<LoginResponse>
// É um tipo genérico do TypeScript que informa ao Axios qual formato esperamos na resposta. 
// Ele ajuda na verificação de tipos durante o desenvolvimento, mas não valida sozinho o JSON recebido em tempo de execução.
// Depois do login bem-sucedido, salvamos o accessToken retornado pelo backend em um armazenamento seguro do dispositivo.
export async function login(
  data: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    '/api/v1/auth/login',
    data,
  );

  await SecureStore.setItemAsync(
    TOKEN_KEY,
    response.data.accessToken,
  );

  return response.data;
}

// O cadastro não salva token, porque seu RegisterResponse não contém accessToken. 
// Depois do cadastro, a tela poderá encaminhar o usuário para o login.
export async function register(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>(
    '/api/v1/auth/register',
    data,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<MeResponse> {
  const response = await api.get<MeResponse>(
    '/api/v1/auth/me',
  );

  return response.data;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
