
import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { listMySightings } from '@/services/sightingService';
import type { SightingResponse } from '@/types/sighting';
import { getImageUrl } from '@/services/api';

export default function MySightingsScreen() {
  const [sightings, setSightings] = useState<SightingResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca somente as ocorrências do usuário autenticado.
  const loadData = useCallback(async () => {
    try {
      setError(null);

      const data = await listMySightings();
      setSightings(data);
    } catch (err) {
      console.error('Erro ao carregar minhas ocorrências:', err);

      setError(
        'Não foi possível carregar suas ocorrências. Tente novamente.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Atualiza os dados sempre que a tela recebe foco.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  function renderSighting({ item }: { item: SightingResponse }) {
    const isOpen = item.status === 'OPEN';

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/sighting/${item.id}`)}
      >
        {item.photoUrls?.length > 0 ? (
          <Image
            source={{ uri: getImageUrl(item.photoUrls[0]) }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>
              Sem foto disponível
            </Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.species}>
            {item.species} · {item.color}
          </Text>

          <Text style={styles.description}>
            {item.description}
          </Text>

          {item.petName ? (
            <Text style={styles.detail}>
              Nome: {item.petName}
            </Text>
          ) : null}

          {item.address ? (
            <Text style={styles.detail}>
              Local: {item.address}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            <Text
              style={[
                styles.status,
                !isOpen && styles.resolvedStatus,
              ]}
            >
              {isOpen ? 'Em aberto' : 'Resolvido'}
            </Text>

            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#23834D" />

        <Text style={styles.loadingText}>
          Carregando suas ocorrências...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Minhas ocorrências
        </Text>

        <Text style={styles.subtitle}>
          Acompanhe os animais que você cadastrou.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadData}
          >
            <Text style={styles.retryText}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sightings}
          renderItem={renderSighting}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#23834D']}
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {sightings.length === 1
                ? '1 ocorrência cadastrada'
                : `${sightings.length} ocorrências cadastradas`}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Você ainda não cadastrou nenhuma ocorrência.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },

  header: {
    padding: 24,
    paddingTop: 55,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#26352B',
  },

  subtitle: {
    fontSize: 13,
    color: '#78827B',
    marginTop: 8,
  },

  list: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#26352B',
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 18,
    overflow: 'hidden',
    elevation: 2,
  },

  photo: {
    width: '100%',
    height: 190,
  },

  noPhoto: {
    height: 130,
    backgroundColor: '#E8EFEA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noPhotoText: {
    color: '#78827B',
    fontSize: 14,
  },

  cardContent: {
    padding: 16,
  },

  species: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#23834D',
    marginBottom: 8,
  },

  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#26352B',
    marginBottom: 10,
  },

  detail: {
    fontSize: 13,
    color: '#66736A',
    marginBottom: 6,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  status: {
    color: '#23834D',
    fontSize: 12,
    fontWeight: 'bold',
  },

  resolvedStatus: {
    color: '#78827B',
  },

  date: {
    color: '#89938B',
    fontSize: 12,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8F5',
  },

  loadingText: {
    marginTop: 12,
    color: '#66736A',
  },

  emptyText: {
    textAlign: 'center',
    color: '#78827B',
    marginTop: 30,
  },

  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },

  errorText: {
    color: '#C0392B',
    textAlign: 'center',
    marginBottom: 16,
  },

  retryButton: {
    backgroundColor: '#23834D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
