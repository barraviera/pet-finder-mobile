import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';

import { listSightings } from '@/services/sightingService';
import type { SightingResponse } from '@/types/sighting';

import * as Location from 'expo-location';

export default function ExploreScreen() {
  const mapRef = useRef<MapView>(null);

  const [sightings, setSightings] = useState<SightingResponse[]>([]);
  const [selectedSighting, setSelectedSighting] =
    useState<SightingResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [locating, setLocating] = useState(false);

  // Busca as ocorrências na API
  useEffect(() => {
    async function loadSightings() {
      try {
        setError(null);

        const data = await listSightings();
        setSightings(data);

      } catch (err) {
        console.error('Erro ao carregar ocorrências no mapa:', err);
        setError('Não foi possível carregar as ocorrências.');

      } finally {
        setLoading(false);
      }
    }

    loadSightings();
  }, []);

  // Ajusta o mapa para enquadrar os marcadores
  useEffect(() => {
    if (!mapReady || sightings.length === 0) {
      return;
    }

    const coordinates = sightings.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
    }));

    if (coordinates.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...coordinates[0],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800,
      );
    } else {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 80,
          right: 60,
          bottom: 100,
          left: 60,
        },
        animated: true,
      });
    }
  }, [mapReady, sightings]);

  // Centraliza o mapa na localização do usuário
  async function handleLocateMe() {
    try {
      setLocating(true);

      // Solicita permissão de localização
      const { status } =
        // requestForegroundPermissionsAsync(): solicita autorização para acessar a localização enquanto o aplicativo está em uso.
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para centralizar o mapa.',
        );
        return;
      }

      // Obtém a posição atual do dispositivo
      // getCurrentPositionAsync(): obtém as coordenadas atuais.
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Centraliza o mapa na localização encontrada
      // animateToRegion(): movimenta o mapa suavemente até as coordenadas encontradas.
      mapRef.current?.animateToRegion(
        {
          // latitudeDelta e longitudeDelta: controlam o nível de aproximação do mapa. Quanto menores os valores, maior o zoom.
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );

    } catch (err) {
      console.error('Erro ao obter localização:', err);

      Alert.alert(
        'Erro',
        'Não foi possível obter sua localização. Verifique se o GPS está ativado.',
      );

    } finally {
      setLocating(false);
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: -23.5505,
          longitude: -46.6333,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={() => setMapReady(true)}
        onPress={() => setSelectedSighting(null)}
      >
        {sightings.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={`${item.species} · ${item.color}`}
            description={item.description}
            onPress={() => setSelectedSighting(item)}
          />
        ))}
      </MapView>

      <Pressable
        style={styles.locationButton}
        onPress={handleLocateMe}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator size="small" color="#23834D" />
        ) : (
          <Text style={styles.locationButtonText}>◎</Text>
        )}
      </Pressable>

      {loading && (
        <View style={styles.message}>
          <ActivityIndicator size="small" color="#23834D" />
          <Text style={styles.messageText}>
            Carregando ocorrências...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.message}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && sightings.length === 0 && (
        <View style={styles.message}>
          <Text style={styles.messageText}>
            Nenhuma ocorrência encontrada.
          </Text>
        </View>
      )}

      {selectedSighting && (
        <View style={styles.selectedCard}>
          <Text style={styles.species}>
            {selectedSighting.species} · {selectedSighting.color}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {selectedSighting.description}
          </Text>

          {selectedSighting.address && (
            <Text style={styles.address} numberOfLines={1}>
              {selectedSighting.address}
            </Text>
          )}

          <Pressable
            style={styles.detailsButton}
            onPress={() =>
              router.push(`/sighting/${selectedSighting.id}`)
            }
          >
            <Text style={styles.detailsButtonText}>
              Ver detalhes
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  message: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  messageText: {
    color: '#26352B',
    fontSize: 13,
  },

  errorText: {
    color: '#C0392B',
    fontSize: 13,
  },

  selectedCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    elevation: 5,
  },

  species: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#23834D',
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    color: '#26352B',
    marginBottom: 8,
  },

  address: {
    fontSize: 12,
    color: '#78827B',
    marginBottom: 12,
  },

  detailsButton: {
    backgroundColor: '#23834D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  locationButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  locationButtonText: {
    fontSize: 30,
    color: '#23834D',
    fontWeight: 'bold',
  },
});