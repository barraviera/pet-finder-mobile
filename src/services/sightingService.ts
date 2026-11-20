
import { api } from './api';

import type {
  AnimalSize,
  AnimalSpecies,
  CreateSightingRequest,
  SightingResponse,
} from '@/types/sighting';

import type { ImagePickerAsset } from 'expo-image-picker';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

// O que é uma interface em TypeScript?
// Uma interface em TypeScript é uma forma de definir a estrutura de um objeto, especificando os tipos de suas propriedades. 
// Ela serve como um contrato que garante que os objetos que implementam essa interface terão as propriedades e tipos definidos. 
// As interfaces são úteis para garantir consistência e segurança de tipo em seu código, permitindo que você defina claramente como os dados devem ser estruturados e utilizados.
// Ela representa os parâmetros aceitos pelo endpoint. Todos são opcionais, permitindo combinar qualquer quantidade de filtros.
export interface SightingFilters {
  species?: AnimalSpecies;
  status?: 'OPEN' | 'RESOLVED';
  animalSize?: AnimalSize;
  color?: string;
  search?: string;
}

// O tipo SightingResponse[] indica que esperamos receber um array de avistamentos.
// Uma resposta hipotética da API poderia ser:
// [
//   {
//     "id": "c9c6c68b-1234-4567-8901-123456789abc",
//     "reporterId": "c9c6c68b-1234-4567-8901-123456789abd",
//     "description": "Cachorro encontrado próximo à praça",
//     "latitude": -23.5505,
//     "longitude": -46.6333,
//     "address": "Rua de exemplo",
//     "species": "DOG",
//     "size": "MEDIUM",
//     "color": "Caramelo",
//     "petName": null,
//     "status": "OPEN",
//     "createdAt": "2026-10-12T18:00:00Z",
//     "resolvedAt": null,
//     "photoUrls": []
//   }
// ]
// Rota de avistamentos: GET /api/v1/sightings que está definida no backend. A função listSightings faz a chamada para essa rota e retorna os dados recebidos.
export async function listSightings(): Promise<
  SightingResponse[]
> {
  const response = await api.get<SightingResponse[]>(
    '/api/v1/sightings',
  );

  return response.data;
}

// Rota de avistamentos do usuário: GET /api/v1/sightings/mine que está definida no backend. A função listMySightings faz a chamada para essa rota e retorna os dados recebidos.
// O que essa função faz?
// É praticamente igual à listSightings() mas retorna apenas os avistamentos do usuário logado. A rota /api/v1/sightings/mine é protegida, ou seja, só pode ser acessada por usuários autenticados. 
// Por isso, é necessário enviar o token de autenticação no cabeçalho da requisição. O axios já está configurado para enviar o token automaticamente.
export async function listMySightings(): Promise<SightingResponse[]> {
  const response = await api.get<SightingResponse[]>('/api/v1/sightings/mine');
  return response.data;
}

export async function getSighting(
  id: string,
): Promise<SightingResponse> {
  const response = await api.get<SightingResponse>(
    `/api/v1/sightings/${id}`,
  );

  return response.data;
}

export async function createSighting(
  data: CreateSightingRequest,
): Promise<SightingResponse> {
  const response = await api.post<SightingResponse>(
    '/api/v1/sightings',
    data,
  );

  return response.data;
}

export async function resolveSighting(
  id: string,
): Promise<SightingResponse> {
  const response = await api.patch<SightingResponse>(
    `/api/v1/sightings/${id}/resolve`,
  );

  return response.data;
}

export async function flagSighting(
  id: string,
  reason?: string,
): Promise<unknown> {
  const response = await api.post(
    `/api/v1/sightings/${id}/flags`,
    reason ? { reason } : {},
  );

  return response.data;
}

// FormData: cria o conteúdo da requisição multipart.
// forEach(): percorre todas as imagens selecionadas.
// uri: informa onde o arquivo está no dispositivo.
// name: define o nome do arquivo.
// type: informa o tipo MIME da imagem.
// photos: é o nome do campo que o Spring Boot espera receber.
export async function uploadSightingPhotos(
  sightingId: string,
  photos: ImagePickerAsset[],
): Promise<void> {
  if (photos.length === 0) {
    return;
  }

  if (photos.length > 3) {
    throw new Error('O limite é de 3 fotos por ocorrência.');
  }

  const formData = new FormData();

  photos.forEach((photo, index) => {
    const mimeType = photo.mimeType?.toLowerCase();

    if (!mimeType || !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(
        `Formato de imagem não permitido: ${photo.fileName ?? photo.uri}`,
      );
    }

    const extension = mimeType.split('/')[1];

    formData.append(
      'photos',
      {
        uri: photo.uri,
        name: photo.fileName ?? `photo_${index}.${extension}`,
        type: mimeType,
      } as any,
    );
  });

  await api.post(
    `/api/v1/sightings/${sightingId}/photos`,
    formData,
    {
      timeout: 60000,
      headers: {
        Accept: 'application/json',
      },
    },
  );
}

// Rota de busca de avistamentos: GET /api/v1/sightings/search que está definida no backend. A função searchSightings faz a chamada para essa rota e retorna os dados recebidos.
// filters = {} permite chamar a função sem filtros.
// ...filters repassa os filtros selecionados.
// trim() remove espaços desnecessários no início e no final dos campos textuais.
// || undefined evita enviar parâmetros textuais vazios.
// params é um recurso do Axios que transforma o objeto em parâmetros da URL.
// Ex.:
// searchSightings({
//   species: 'DOG',
//   status: 'OPEN',
//   search: 'Rex',
// });
export async function searchSightings(
  filters: SightingFilters = {},
): Promise<SightingResponse[]> {
  const params = {
    ...filters,
    color: filters.color?.trim() || undefined,
    search: filters.search?.trim() || undefined,
  };

  const response = await api.get<SightingResponse[]>(
    '/api/v1/sightings/search',
    { params },
  );

  return response.data;
}
