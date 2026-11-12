
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

// DOG, CAT, OTHER correspondem aos valores esperados pela API para o campo "species".
const SPECIES = [
  { label: 'Cachorro', value: 'DOG' },
  { label: 'Gato', value: 'CAT' },
  { label: 'Outro', value: 'OTHER' },
];

// SMALL, MEDIUM, LARGE correspondem aos valores esperados pela API para o campo "size".
const SIZES = [
  { label: 'Pequeno', value: 'SMALL' },
  { label: 'Médio', value: 'MEDIUM' },
  { label: 'Grande', value: 'LARGE' },
];

// A tela de criação de avistamento é um formulário que coleta informações sobre o animal encontrado. 
// Por enquanto, apenas validamos os dados e exibimos um alerta. Na próxima etapa, vamos implementar a obtenção da localização e o envio do cadastro para a API.
export default function CreateSightingScreen() {
  // Estados para armazenar os valores dos campos do formulário
  const [description, setDescription] = useState('');
  const [species, setSpecies] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [petName, setPetName] = useState('');

  // Função chamada quando o usuário pressiona o botão "Continuar". 
  // Ela valida os campos obrigatórios e exibe um alerta.
  function handleContinue() {
    if (!description.trim() || !species || !color.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha a descrição, a espécie e a cor do animal.',
      );
      return;
    }

    // Por enquanto, apenas validamos os dados.
    // Na próxima etapa vamos obter a localização
    // e enviar o cadastro para a API.

    Alert.alert(
      'Formulário validado!',
      'Os dados foram preenchidos corretamente. Vamos implementar a localização na próxima etapa.',
    );
  }

  // Função para renderizar as opções de espécie e porte do animal.
  function renderOptions(
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (value: string) => void,
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

        <Pressable
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>
            Continuar
          </Text>
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
});
