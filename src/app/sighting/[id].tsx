import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getSighting } from '@/services/sightingService';
import { getImageUrl } from '@/services/api';

import type { SightingResponse } from '@/types/sighting';

export default function SightingDetailsScreen() {
  // Recupera o ID enviado pela rota
  const { id } = useLocalSearchParams<{ id: string }>();

  // Estado da ocorrência
  const [sighting, setSighting] = useState<SightingResponse | null>(null);

  // Estados de carregamento e erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca os detalhes da ocorrência
  useEffect(() => {
    async function loadSighting() {
      try {
        setError(null);

        const data = await getSighting(id);
        setSighting(data);

      } catch (err) {
        console.error('Erro ao carregar ocorrência:', err);
        setError('Não foi possível carregar os detalhes da ocorrência.');

      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadSighting();
    }
  }, [id]);

  // Carregamento
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#23834D" />
        <Text style={styles.loadingText}>
          Carregando detalhes...
        </Text>
      </View>
    );
  }

  // Erro ou ocorrência não encontrada
  if (error || !sighting) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ?? 'Ocorrência não encontrada.'}
        </Text>

        <Text
          style={styles.backLink}
          onPress={() => router.back()}
        >
          Voltar
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text
          style={styles.backLink}
          onPress={() => router.back()}
        >
          ‹ Voltar
        </Text>

        <Text style={styles.title}>
          Detalhes da ocorrência
        </Text>
      </View>

      {/* Fotos */}
      {sighting.photoUrls.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoList}
        >
          {sighting.photoUrls.map((photo, index) => (
            <Image
              key={`${photo}-${index}`}
              source={{ uri: getImageUrl(photo) }}
              style={styles.photo}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noPhoto}>
          <Text style={styles.noPhotoText}>
            Sem fotos disponíveis
          </Text>
        </View>
      )}

      {/* Informações */}
      <View style={styles.content}>
        <Text style={styles.species}>
          {sighting.species} · {sighting.color}
        </Text>

        <Text style={styles.description}>
          {sighting.description}
        </Text>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Nome do animal</Text>
          <Text style={styles.value}>
            {sighting.petName ?? 'Não informado'}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Porte</Text>
          <Text style={styles.value}>
            {sighting.size ?? 'Não informado'}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Localização</Text>
          <Text style={styles.value}>
            {sighting.address ?? 'Endereço não informado'}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.status}>
            {sighting.status === 'OPEN'
              ? 'Em aberto'
              : sighting.status}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Data do avistamento</Text>
          <Text style={styles.value}>
            {new Date(sighting.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F8F5',
  },

  loadingText: {
    marginTop: 12,
    color: '#66736A',
  },

  errorText: {
    color: '#C0392B',
    textAlign: 'center',
    marginBottom: 16,
  },

  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 55,
  },

  backLink: {
    color: '#23834D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#26352B',
  },

  photoList: {
    marginTop: 16,
  },

  photo: {
    width: 320,
    height: 260,
    borderRadius: 12,
    marginHorizontal: 8,
  },

  noPhoto: {
    height: 180,
    backgroundColor: '#E8EFEA',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },

  noPhotoText: {
    color: '#78827B',
  },

  content: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    borderRadius: 14,
  },

  species: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#23834D',
    marginBottom: 12,
  },

  description: {
    fontSize: 18,
    fontWeight: '600',
    color: '#26352B',
    marginBottom: 20,
  },

  infoGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 12,
    color: '#89938B',
    marginBottom: 5,
  },

  value: {
    fontSize: 15,
    color: '#26352B',
  },

  status: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#23834D',
  },
});
