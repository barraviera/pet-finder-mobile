
export type AnimalSpecies = 'DOG' | 'CAT' | 'OTHER';

export type AnimalSize = 'SMALL' | 'MEDIUM' | 'LARGE';


// Definir as interfaces para as requisições e respostas de autenticação
export interface CreateSightingRequest {
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  species: AnimalSpecies;
  size?: AnimalSize;
  color: string;
  petName?: string;
}

export interface SightingResponse {
  id: string;
  reporterId: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  species: string;
  size: string | null;
  color: string;
  petName: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  photoUrls: string[];
}