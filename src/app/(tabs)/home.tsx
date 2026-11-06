
import { useCallback, useEffect, useState } from 'react';

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

import { getCurrentUser } from '@/services/authService';
import { listSightings } from '@/services/sightingService';

import type { MeResponse } from '@/types/auth';
import type { SightingResponse } from '@/types/sighting';

export default function HomeScreen() {
  // Dados do usuário autenticado
  const [user, setUser] = useState<MeResponse | null>(null);

  // Lista de avistamentos
  const [sightings, setSightings] = useState<SightingResponse[]>([]);

  // Estados da tela
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca os dados da API
  const loadData = useCallback(async () => {
    try {
      setError(null);

      // Aqui temos um conceito importante de JavaScript.
      // Estamos realizando duas requisições simultaneamente: Buscar o usuário e Buscar os avistamentos.
      // Sem Promise.all, poderíamos fazer uma chamada e esperar sua conclusão para só depois iniciar a outra.
      // Com Promise.all, ambas começam juntas. Se alguma falhar, a operação inteira entra no catch.
      const [userData, sightingsData] = await Promise.all([
        getCurrentUser(),
        listSightings(),
      ]);
      // Quando essas funções são executadas, o React atualiza os estados e renderiza novamente a tela com os dados recebidos.
      setUser(userData);
      setSightings(sightingsData);

    } catch (err) {
      console.error('Erro ao carregar Home:', err);

      setError(
        'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Executa quando a tela é montada
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Atualização manual da lista
  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  // Formata a data
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  // Componente de cada avistamento
  function renderSighting({ item }: { item: SightingResponse }) {
    return (
      <View style={styles.card}>

        {item.photoUrls?.length > 0 ? (
          <Image
            source={{ uri: item.photoUrls[0] }}
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
            <Text style={styles.status}>
              {item.status === 'OPEN' ? 'Em aberto' : item.status}
            </Text>

            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

        </View>
      </View>
    );
  }

  // Carregamento inicial
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#23834D" />

        <Text style={styles.loadingText}>
          Carregando avistamentos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>
          PetFinder
        </Text>

        <Text style={styles.welcome}>
          Olá, {user?.name ?? 'usuário'}!
        </Text>

        <Text style={styles.subtitle}>
          Ajude animais a encontrarem o caminho de casa.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error}
          </Text>

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
              Animais avistados
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum avistamento cadastrado ainda.
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#23834D',
  },

  welcome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#26352B',
    marginTop: 16,
  },

  subtitle: {
    fontSize: 13,
    color: '#78827B',
    marginTop: 6,
  },

  list: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  sectionTitle: {
    fontSize: 20,
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
