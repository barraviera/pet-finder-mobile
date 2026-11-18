import { useEffect, useMemo, useRef, useState } from 'react';
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

// Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // earthRadius: raio médio da Terra em quilômetros.
  const earthRadius = 6371;
  // toRadians: converte graus em radianos, necessários para as funções trigonométricas.
  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    // Math.sin e Math.cos: participam do cálculo da distância.
    // O resultado é retornado em quilômetros.
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

// NEARBY_RADIUS_KM: define a distância máxima para considerar uma ocorrência como "próxima" do usuário.
const NEARBY_RADIUS_KM = 5;

export default function ExploreScreen() {
  const mapRef = useRef<MapView>(null);

  const [sightings, setSightings] = useState<SightingResponse[]>([]);
  const [selectedSighting, setSelectedSighting] =
    useState<SightingResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [locating, setLocating] = useState(false);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Distância entre a localização do usuário e a ocorrência selecionada, se houver
  const selectedDistance =
    userLocation && selectedSighting
      ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        selectedSighting.latitude,
        selectedSighting.longitude,
      )
      : null;

  // Estado para controlar se apenas ocorrências próximas devem ser exibidas
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);

  // Filtra as ocorrências próximas com base na localização do usuário
  // map(): calcula a distância de cada ocorrência.
  // filter(): mantém somente as que estão a até 5 km.
  // sort(): ordena da mais próxima para a mais distante.
  // useMemo(): memoriza o resultado e refaz o cálculo somente quando sightings ou userLocation mudar.
  const nearbySightings = useMemo(() => {
    if (!userLocation) {
      return [];
    }

    return sightings
      .map((item) => ({
        ...item,
        distanceKm: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.latitude,
          item.longitude,
        ),
      }))
      .filter((item) => item.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [sightings, userLocation]);

  // Determina quais ocorrências devem ser exibidas no mapa com base no estado showNearbyOnly.
  const visibleSightings = showNearbyOnly
    ? nearbySightings
    : sightings;

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
    if (!mapReady || visibleSightings.length === 0) {
      return;
    }

    const coordinates = visibleSightings.map((item) => ({
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
  }, [mapReady, visibleSightings]);

  // Obtém a localização atual do usuário, se a permissão for concedida
  async function fetchUserLocation() {
    // requestForegroundPermissionsAsync(): solicita autorização para acessar a localização enquanto o aplicativo está em uso.
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    // getCurrentPositionAsync(): obtém as coordenadas atuais.
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  // Centraliza o mapa na localização do usuário
  async function handleLocateMe() {
    try {
      setLocating(true);

      const coords = await fetchUserLocation();

      if (!coords) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para centralizar o mapa.',
        );
        return;
      }

      setUserLocation(coords);

      // Centraliza o mapa na localização encontrada
      // animateToRegion(): movimenta o mapa suavemente até as coordenadas encontradas.
      mapRef.current?.animateToRegion(
        {
          // latitudeDelta e longitudeDelta: controlam o nível de aproximação do mapa. Quanto menores os valores, maior o zoom.
          ...coords,
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

  // Alterna entre exibir todas as ocorrências ou apenas as próximas do usuário
  function handleToggleNearby() {
    if (!userLocation) {
      Alert.alert(
        'Localização necessária',
        'Primeiro toque no botão de localização para encontrar sua posição.',
      );
      return;
    }

    setShowNearbyOnly((current) => !current);
    setSelectedSighting(null);
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

        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Você está aqui"
            description="Sua localização atual"
            pinColor="#2878E8"
          />
        )}

        {visibleSightings.map((item) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={`${item.species} · ${item.color}`}
            description={item.description}
            onPress={(event) => {
              // Impede que o toque no marcador propague para o onPress do
              // MapView, que limparia a seleção logo em seguida.
              event.stopPropagation();
              setSelectedSighting(item);
            }}
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

      <Pressable
        style={[
          styles.nearbyButton,
          showNearbyOnly && styles.nearbyButtonActive,
        ]}
        onPress={handleToggleNearby}
      >
        <Text
          style={[
            styles.nearbyButtonText,
            showNearbyOnly && styles.nearbyButtonTextActive,
          ]}
        >
          {showNearbyOnly
            ? `Mostrar todas (${sightings.length})`
            : `Próximos de mim · ${nearbySightings.length}`}
        </Text>
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

          {selectedDistance !== null && (
            <Text style={styles.distance}>
              A aproximadamente {selectedDistance < 1
                ? `${Math.round(selectedDistance * 1000)} metros`
                : `${selectedDistance.toFixed(2)} km`} de você
            </Text>
          )}

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

  distance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#23834D',
    marginBottom: 12,
  },

  nearbyButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    elevation: 5,
  },

  nearbyButtonActive: {
    backgroundColor: '#23834D',
  },

  nearbyButtonText: {
    color: '#23834D',
    fontSize: 13,
    fontWeight: 'bold',
  },

  nearbyButtonTextActive: {
    color: '#FFFFFF',
  },
});