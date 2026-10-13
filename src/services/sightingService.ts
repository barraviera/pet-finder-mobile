
import { api } from './api';

import type {
  CreateSightingRequest,
  SightingResponse,
} from '@/types/sighting';

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
export async function listSightings(): Promise<
  SightingResponse[]
> {
  const response = await api.get<SightingResponse[]>(
    '/api/v1/sightings',
  );

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
