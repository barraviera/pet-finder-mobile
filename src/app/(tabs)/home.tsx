import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  AnimalSize,
  AnimalSpecies,
  SightingResponse,
} from '@/types/sighting';

import { useAuth } from '@/contexts/AuthContext';

import { router } from 'expo-router';

import { getImageUrl } from '@/services/api';

import {
  searchSightings,
} from '@/services/sightingService';

import type {
  SightingFilters,
} from '@/services/sightingService';

export default function HomeScreen() {

  // Lista de avistamentos
  const [sightings, setSightings] = useState<SightingResponse[]>([]);

  // Estados da tela
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usuário autenticado pelo contexto global
  const { user } = useAuth();

  // Filtros selecionados
  // species, status e animalSize guardam as opções selecionadas.
  // color e search guardam os textos digitados.
  // appliedFilters guarda os filtros efetivamente enviados à API.
  // Essa separação permitirá que o usuário altere os campos sem disparar consultas imediatamente.
  const [species, setSpecies] = useState<AnimalSpecies | undefined>();
  const [status, setStatus] = useState<'OPEN' | 'RESOLVED' | undefined>();
  const [animalSize, setAnimalSize] = useState<AnimalSize | undefined>();
  const [color, setColor] = useState('');
  const [search, setSearch] = useState('');

  // Indica se existem filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState<SightingFilters>({});

  // Busca os avistamentos da API
  // Observe que agora temos: [appliedFilters] como dependência do useCallback.
  // Isso significa que a função será recriada quando os filtros aplicados mudarem.
  // Como seu useFocusEffect já depende de loadData, ele continuará atualizando a lista quando a Home receber foco.
  const loadData = useCallback(async () => {
    try {
      setError(null);

      const sightingsData = await searchSightings(appliedFilters);

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
  }, [appliedFilters]);

  // Antes usavamos o useEffect, mas agora estamos usando o useFocusEffect para recarregar os dados sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Atualização manual da lista
  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  // Navega para a tela de criação de avistamento
  function handleCreateSighting() {
    router.push('/create-sighting');
  }

  // Formata a data
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  // Componente (card) de cada avistamento
  function renderSighting({ item }: { item: SightingResponse }) {
    return (
      // Pressable: permite detectar o toque do usuário.
      // onPress: executa uma ação quando o card é pressionado.
      // router.push: navega para outra tela.
      // ${item.id}: envia o identificador daquela ocorrência na URL.
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
            <Text style={styles.status}>
              {item.status === 'OPEN' ? 'Em aberto' : item.status}
            </Text>

            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

        </View>
      </Pressable>
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

  // Aplica os filtros selecionados
  function handleApplyFilters() {
    const filters: SightingFilters = {
      species,
      status,
      animalSize,
      color: color.trim() || undefined,
      search: search.trim() || undefined,
    };

    setAppliedFilters(filters);
  }

  // Limpa os filtros selecionados
  function handleClearFilters() {
    setSpecies(undefined);
    setStatus(undefined);
    setAnimalSize(undefined);
    setColor('');
    setSearch('');
    setAppliedFilters({});
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

        <Pressable
          style={styles.createButton}
          onPress={handleCreateSighting}
        >
          <Text style={styles.createButtonText}>
            + Registrar animal
          </Text>
        </Pressable>
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
            <View>
              <Text style={styles.sectionTitle}>
                Animais avistados
              </Text>

              <View style={styles.filterContainer}>
                <Text style={styles.filterTitle}>Buscar ocorrências</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Nome, descrição ou endereço..."
                  placeholderTextColor="#89938B"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />

                <Text style={styles.filterLabel}>Espécie</Text>

                <View style={styles.filterOptions}>
                  {[
                    { label: 'Todas', value: undefined },
                    { label: 'Cachorros', value: 'DOG' },
                    { label: 'Gatos', value: 'CAT' },
                    { label: 'Outros', value: 'OTHER' },
                  ].map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.filterOption,
                        species === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() => setSpecies(option.value as AnimalSpecies | undefined)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          species === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.filterLabel}>Status</Text>

                <View style={styles.filterOptions}>
                  {[
                    { label: 'Todos', value: undefined },
                    { label: 'Em aberto', value: 'OPEN' },
                    { label: 'Resolvidos', value: 'RESOLVED' },
                  ].map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.filterOption,
                        status === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() => setStatus(option.value as 'OPEN' | 'RESOLVED' | undefined)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          status === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.filterLabel}>Porte</Text>

                <View style={styles.filterOptions}>
                  {[
                    { label: 'Todos', value: undefined },
                    { label: 'Pequeno', value: 'SMALL' },
                    { label: 'Médio', value: 'MEDIUM' },
                    { label: 'Grande', value: 'LARGE' },
                  ].map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.filterOption,
                        animalSize === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() => setAnimalSize(option.value as AnimalSize | undefined)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          animalSize === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.filterLabel}>Cor</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="Ex.: preto, branco, caramelo..."
                  placeholderTextColor="#89938B"
                  value={color}
                  onChangeText={setColor}
                  autoCapitalize="none"
                />

                <View style={styles.filterActions}>
                  <Pressable onPress={handleClearFilters}>
                    <Text style={styles.clearFiltersText}>Limpar filtros</Text>
                  </Pressable>

                  <Pressable
                    style={styles.applyFiltersButton}
                    onPress={handleApplyFilters}
                  >
                    <Text style={styles.applyFiltersText}>Aplicar filtros</Text>
                  </Pressable>
                </View>
              </View>
            </View>
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

  createButton: {
    backgroundColor: '#23834D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  filterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#26352B',
    marginBottom: 12,
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#66736A',
    marginTop: 16,
    marginBottom: 8,
  },

  searchInput: {
    backgroundColor: '#F5F8F5',
    borderWidth: 1,
    borderColor: '#E1E8E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#26352B',
  },

  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  filterOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F0F3F1',
  },

  filterOptionActive: {
    backgroundColor: '#23834D',
  },

  filterOptionText: {
    color: '#66736A',
    fontSize: 13,
    fontWeight: '500',
  },

  filterOptionTextActive: {
    color: '#FFFFFF',
  },

  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },

  clearFiltersText: {
    color: '#66736A',
    fontSize: 13,
    fontWeight: '600',
  },

  applyFiltersButton: {
    backgroundColor: '#23834D',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  applyFiltersText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
