
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createSighting,
  uploadSightingPhotos
} from '@/services/sightingService';

import { router } from 'expo-router';
// Importa o módulo de localização do Expo para obter a localização do usuário
import * as Location from 'expo-location';

import type {
  AnimalSize,
  AnimalSpecies,
  CreateSightingRequest,
} from '@/types/sighting';

import * as ImagePicker from 'expo-image-picker';

import axios from 'axios';

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

  // Estado para armazenar as fotos selecionadas pelo usuário
  // Estamos utilizando um array porque queremos permitir o envio de várias fotos de uma mesma ocorrência.
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);

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
    if (!description.trim() || !species || !color.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha a descrição, a espécie e a cor do animal.',
      );
      return;
    }

    if (!location) {
      Alert.alert(
        'Localização necessária',
        'Obtenha sua localização antes de continuar.',
      );
      return;
    }

    try {
      setSubmitting(true);

      // 1. Monta os dados da ocorrência
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

      // 2. Cadastra a ocorrência
      const response = await createSighting(data);

      console.log('Ocorrência cadastrada:', response);

      // 3. Envia as fotos, caso existam
      if (photos.length > 0) {
        try {
          await uploadSightingPhotos(response.id, photos);

          console.log('Fotos enviadas com sucesso!');
        } catch (photoError) {
          if (axios.isAxiosError(photoError)) {
            console.error('Erro no upload:', {
              message: photoError.message,
              status: photoError.response?.status,
              response: photoError.response?.data,
            });
          } else {
            console.error('Erro no upload:', photoError);
          }

          Alert.alert(
            'Ocorrência cadastrada',
            'A ocorrência foi salva, mas não foi possível enviar as fotos.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/home'),
              },
            ],
          );

          return;
        }
      }

      // 4. Confirma o sucesso
      Alert.alert(
        'Cadastro realizado!',
        photos.length > 0
          ? 'A ocorrência e as fotos foram cadastradas com sucesso.'
          : 'A ocorrência foi cadastrada com sucesso.',
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
        'Não foi possível cadastrar a ocorrência. Verifique sua conexão e tente novamente.',
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

// Função para abrir a galeria de fotos e permitir que o usuário selecione imagens do animal encontrado.
async function handleSelectPhotos() {
  try {
    // Solicita permissão para acessar a galeria
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso à galeria para selecionar as fotos do animal.',
      );
      return;
    }

    // Abre a galeria do dispositivo
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true, // permite selecionar várias imagens.
      selectionLimit: 3, // limita a seleção a três fotos.
      quality: 0.8, // reduz um pouco a qualidade para ajudar a controlar o tamanho dos arquivos.
    });

    if (result.canceled) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const validPhotos = result.assets.filter((photo) =>
      allowedTypes.includes(photo.mimeType?.toLowerCase() ?? ''),
    );

    if (validPhotos.length !== result.assets.length) {
      Alert.alert(
        'Formato não permitido',
        'Algumas imagens foram ignoradas. Utilize JPEG, PNG ou WEBP.',
      );
    }

    setPhotos(validPhotos);

  } catch (error) {
    console.error('Erro ao selecionar fotos:', error);

    Alert.alert(
      'Erro',
      'Não foi possível acessar a galeria de imagens.',
    );
  }
}

// Função para remover uma foto selecionada pelo usuário. Ela recebe o índice da foto a ser removida e atualiza o estado photos.
// Aqui estamos utilizando filter() para criar um novo array sem a imagem selecionada.
function handleRemovePhoto(index: number) {
  setPhotos((currentPhotos) =>
    currentPhotos.filter((_, i) => i !== index),
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

      <Text style={styles.label}>Fotos do animal</Text>

      <Pressable
        style={styles.photoButton}
        onPress={handleSelectPhotos}
      >
        <Text style={styles.photoButtonText}>
          + Selecionar fotos da galeria
        </Text>
      </Pressable>

      {photos.length > 0 && (
        <View style={styles.photosContainer}>
          {photos.map((photo, index) => (
            <View key={photo.assetId ?? photo.uri} style={styles.photoItem}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoPreview}
              />

              <Pressable
                style={styles.removePhotoButton}
                onPress={() => handleRemovePhoto(index)}
              >
                <Text style={styles.removePhotoText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.photoInfo}>
        Você pode selecionar até 3 fotos.
      </Text>

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

  photoButton: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#23834D',
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },

  photoButtonText: {
    color: '#23834D',
    fontSize: 15,
    fontWeight: '600',
  },

  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },

  photoItem: {
    width: 100,
    height: 100,
    position: 'relative',
  },

  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D64545',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 23,
  },

  photoInfo: {
    fontSize: 12,
    color: '#89938B',
    marginTop: 8,
  },
});
