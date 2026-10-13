
// Importar o axios para fazer requisições HTTP
import axios from 'axios';
// Importar o SecureStore do Expo para armazenar tokens de forma segura
import * as SecureStore from 'expo-secure-store';
// Definir a chave para armazenar o token de acesso no SecureStore
export const TOKEN_KEY = 'petfinder_access_token';
// Obter a URL base da API a partir das variáveis de ambiente
const baseURL = process.env.EXPO_PUBLIC_API_URL;

// Se a URL base não estiver definida, lançar um erro informando que é necessário configurar a variável de ambiente
if (!baseURL) {
  throw new Error(
    'Configure EXPO_PUBLIC_API_URL no arquivo .env',
  );
}

// Criar uma instância do axios com a URL base e configurações padrão
export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

// Adicionar um interceptor de requisição para incluir o token de acesso no cabeçalho Authorization
api.interceptors.request.use(async (config) => {
  // Obter o token de acesso armazenado no SecureStore  
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  // Se o token estiver presente, adicioná-lo ao cabeçalho Authorization da requisição  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Retornar a configuração da requisição para que ela seja enviada com o token incluído
  return config;
});
