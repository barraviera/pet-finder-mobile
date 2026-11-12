
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { login, getCurrentUser, logout } from '@/services/authService';
import { TOKEN_KEY } from '@/services/api';

import type { MeResponse, LoginRequest } from '@/types/auth';

type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

interface AuthContextData {
  user: MeResponse | null;
  status: AuthStatus;
  signIn: (data: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Criamos um estado global para armazenar o usuário e o status da autenticação. 
  // Inicialmente é null, porque ainda não sabemos se existe uma sessão.
  const [user, setUser] = useState<MeResponse | null>(null);
  // Criamos os estados da autenticação.
  // Essa definição é um Union Type do TypeScript.
  // Em vez de utilizar vários booleanos, como isLoading, isLoggedIn e hasError, criamos um único estado com quatro possibilidades.
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Verifica se existe uma sessão válida
  const checkSession = useCallback(async () => {
    setStatus('loading');

    try {
      // Verificamos a sessão
      // Buscamos o JWT armazenado anteriormente.
      // Se não existir, o usuário não está autenticado.      
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!token) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }
      // Se existir, executamos:
      // Essa função chama sua rota Java: GET /api/v1/auth/me
      const currentUser = await getCurrentUser();
      // Se a API confirmar a autenticação, armazenamos o usuário no contexto.
      // Uma decisão importante: se ocorrer um erro de conexão, preservamos o token. 
      // Não queremos desconectar o usuário simplesmente porque o servidor está temporariamente indisponível.
      setUser(currentUser);
      setStatus('authenticated');

    } catch (error) {
      console.error('Erro ao verificar sessão:', error);

      if (
        axios.isAxiosError(error) &&
        [401, 403].includes(error.response?.status ?? 0)
      ) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);

        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      // Erros de conexão não apagam o token
      setStatus('error');
    }
  }, []);

  // Executa a verificação ao iniciar o aplicativo
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Realiza o login
  const signIn = useCallback(async (data: LoginRequest) => {
    await login(data);

    const currentUser = await getCurrentUser();

    setUser(currentUser);
    setStatus('authenticated');
  }, []);

  // Encerra a sessão
  const signOut = useCallback(async () => {
    await logout();

    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Atualiza os dados do usuário
  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();

    setUser(currentUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      signOut,
      refreshUser,
      checkSession,
    }),
    [user, status, signIn, signOut, refreshUser, checkSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para acessar a autenticação
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser utilizado dentro de AuthProvider.',
    );
  }

  return context;
}
