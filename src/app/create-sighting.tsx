
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createSighting } from '@/services/sightingService';

import { router } from 'expo-router';
// Importa o módulo de localização do Expo para obter a localização do usuário
import * as Location from 'expo-location';

import type {
  AnimalSize,
  AnimalSpecies,
  CreateSightingRequest,
} from '@/types/sighting';

// DOG, CAT, OTHER correspondem aos valores esperados pela API para o campo "species".
const SPECIES: { label: string; value: AnimalSpecies }[] = [
  { label: 'Cachorro', value: 'DOG' },
  { label: 'Gato', value: 'CAT' },
  { label: 'Outro', value: 'OTHER' },
];

// SMALL, MEDIUM, LARGE correspondem aos valores esperados pela API para o campo "size".
const SIZES: { label: string; value: AnimalSize }[] = [
  { label: 'Pequeno', value: 'SMALL' },
  { label: 'Médio', value: 'MEDIUM' },
  { label: 'Grande', value: 'LARGE' },
];

// A tela de criação de avistamento é um formulário que coleta informações sobre o animal encontrado. 
// Por enquanto, apenas validamos os dados e exibimos um alerta. Na próxima etapa, vamos implementar a obtenção da localização e o envio do cadastro para a API.
export default function CreateSightingScreen() {
  // Estados para armazenar os valores dos campos do formulário
  const [description, setDescription] = useState('');
  const [species, setSpecies] = useState<AnimalSpecies | ''>('');
  const [size, setSize] = useState<AnimalSize | ''>('');
  const [color, setColor] = useState('');
  const [petName, setPetName] = useState('');

  // Estado para armazenar a localização do usuário. Inicialmente é null, e será preenchido com latitude, longitude e endereço quando obtivermos a localização.
  // Aqui temos dois estados: location: guarda as coordenadas e o endereço e loadingLocation: controla o carregamento enquanto o GPS é consultado.
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string | null;
  } | null>(null);

  // loadingLocation: controla o carregamento enquanto o GPS é consultado.
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Função para obter a localização do usuário. Ela solicita permissão, obtém as coordenadas e converte em um endereço aproximado.
  async function handleGetLocation() {
    try {
      setLoadingLocation(true);

      // 1. Verifica e solicita a permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para registrar onde o animal foi encontrado.',
        );
        return;
      }

      // 2. Obtém as coordenadas do dispositivo
      // getCurrentPositionAsync() obtém as coordenadas geográficas do dispositivo.
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;

      // 3. Converte as coordenadas em um endereço aproximado
      // reverseGeocodeAsync() faz o processo inverso: recebe latitude e longitude e tenta encontrar um endereço correspondente.
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address: string | null = null;

      if (addresses.length > 0) {
        const result = addresses[0];

        address = [
          result.street,
          result.streetNumber,
          result.district,
          result.city,
          result.region,
        ]
          .filter(Boolean)
          .join(', ');
      }

      // 4. Armazena os dados no estado
      setLocation({
        latitude,
        longitude,
        address,
      });

      Alert.alert(
        'Localização obtida!',
        address ?? `Latitude: ${latitude}\nLongitude: ${longitude}`,
      );
    } catch (error) {
      console.error('Erro ao obter localização:', error);

      Alert.alert(
        'Erro',
        'Não foi possível obter sua localização. Verifique se o GPS está ativado.',
      );
    } finally {
      setLoadingLocation(false);
    }
  }

  // Função chamada quando o usuário pressiona o botão "Continuar". 
  // Ela valida os campos obrigatórios e exibe um alerta.
  async function handleContinue() {
    // 1. Validar os campos obrigatórios
    if (!description.trim() || !species || !color.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha a descrição, a espécie e a cor do animal.',
      );
      return;
    }

    // 2. Validar a localização
    if (!location) {
      Alert.alert(
        'Localização necessária',
        'Obtenha sua localização antes de continuar.',
      );
      return;
    }

    try {
      setSubmitting(true);

      // 3. Montar o objeto esperado pela API
      const data: CreateSightingRequest = {
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address ?? undefined,
        species,
        size: size || undefined,
        color: color.trim(),
        petName: petName.trim() || undefined,
      };

      // 4. Enviar os dados para o Spring Boot
      const response = await createSighting(data);

      console.log('Ocorrência cadastrada:', response);

      // 5. Informar o sucesso
      Alert.alert(
        'Cadastro realizado!',
        'A ocorrência foi cadastrada com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/home'),
          },
        ],
      );
    } catch (error) {
      console.error('Erro ao cadastrar ocorrência:', error);

      Alert.alert(
        'Erro',
        'Não foi possível cadastrar a ocorrência. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Função para renderizar as opções de espécie e porte do animal.
  function renderOptions<T extends string>(
    options: { label: string; value: T }[],
    selected: T | '',
    onSelect: (value: T) => void,
  ) {
    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selected === option.value;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backButton}>‹ Voltar</Text>
      </Pressable>

      <Text style={styles.title}>Encontrou um animal?</Text>

      <Text style={styles.subtitle}>
        Ajude a comunidade a encontrar o tutor desse animal.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Espécie *</Text>

        {renderOptions(SPECIES, species, setSpecies)}

        <Text style={styles.label}>Porte</Text>

        {renderOptions(SIZES, size, setSize)}

        <Text style={styles.label}>Cor predominante *</Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Marrom e branco"
          value={color}
          onChangeText={setColor}
        />

        <Text style={styles.label}>Nome do animal</Text>

        <TextInput
          style={styles.input}
          placeholder="Se souber o nome"
          value={petName}
          onChangeText={setPetName}
        />

        <Text style={styles.label}>Descrição *</Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva o animal, onde foi encontrado e outras características..."
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Localização *</Text>

        <Pressable
          style={styles.locationButton}
          onPress={handleGetLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#23834D" />
          ) : (
            <Text style={styles.locationButtonText}>
              {location ? 'Atualizar localização' : 'Obter minha localização'}
            </Text>
          )}
        </Pressable>

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationSuccess}>
              ✓ Localização obtida
            </Text>

            <Text style={styles.locationAddress}>
              {location.address ?? 'Endereço não identificado'}
            </Text>

            <Text style={styles.coordinates}>
              Latitude: {location.latitude.toFixed(6)}
              {'\n'}
              Longitude: {location.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.button,
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Cadastrar ocorrência
            </Text>
          )}
        </Pressable>

        <Text style={styles.requiredInfo}>
          * Campos obrigatórios
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },
  content: {
    padding: 24,
    paddingTop: 55,
    paddingBottom: 40,
  },
  backButton: {
    fontSize: 16,
    color: '#23834D',
    fontWeight: '600',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#26352B',
  },
  subtitle: {
    fontSize: 14,
    color: '#78827B',
    marginTop: 8,
    marginBottom: 28,
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34443A',
    marginBottom: 10,
    marginTop: 16,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#26352B',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: '#23834D',
    borderColor: '#23834D',
  },
  optionText: {
    color: '#34443A',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  button: {
    height: 52,
    backgroundColor: '#23834D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requiredInfo: {
    color: '#89938B',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },

  locationButton: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#23834D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },

  locationButtonText: {
    color: '#23834D',
    fontSize: 15,
    fontWeight: '600',
  },

  locationInfo: {
    backgroundColor: '#EAF4EC',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },

  locationSuccess: {
    color: '#23834D',
    fontWeight: 'bold',
    fontSize: 14,
  },

  locationAddress: {
    color: '#34443A',
    fontSize: 14,
    marginTop: 8,
  },

  coordinates: {
    color: '#66736A',
    fontSize: 12,
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
