
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import axios from 'axios';
import { register } from '@/services/authService';

export default function RegisterScreen() {
  // Estados dos campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estado para controlar o carregamento
  const [loading, setLoading] = useState(false);

  // Executa o cadastro
  async function handleRegister() {
    // Validamos campos do formulário
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert(
        'Atenção',
        'Preencha nome, e-mail e senha.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Atenção',
        'As senhas informadas não coincidem.',
      );
      return;
    }

    try {
      setLoading(true);

      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert(
        'Cadastro realizado',
        'Agora você já pode entrar com sua conta.',
      );

      // Cadastro realizado: segue para a tela de login
      router.replace('/login');

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          Alert.alert(
            'E-mail já cadastrado',
            'Utilize outro e-mail ou faça login.',
          );
        } else if (!error.response) {
          Alert.alert(
            'Erro de conexão',
            'Não foi possível conectar ao servidor.',
          );
        } else {
          Alert.alert(
            'Erro',
            'Não foi possível realizar o cadastro.',
          );
        }
      } else {
        Alert.alert(
          'Erro',
          'Ocorreu um erro inesperado.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>PetFinder</Text>

          <Text style={styles.subtitle}>
            Ajudando animais a encontrarem o caminho de casa.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>
            Criar conta
          </Text>

          <Text style={styles.description}>
            Preencha os dados abaixo para se cadastrar.
          </Text>

          <Text style={styles.label}>
            Nome
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />

          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Crie uma senha"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <Text style={styles.label}>
            Confirmar senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Repita a senha"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <Pressable
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Cadastrar
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.footer}>
            Já tem uma conta? Entrar
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
  },

  header: {
    alignItems: 'center',
    marginBottom: 45,
  },

  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#23834D',
  },

  subtitle: {
    fontSize: 14,
    color: '#66736A',
    textAlign: 'center',
    marginTop: 10,
  },

  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#26352B',
  },

  description: {
    fontSize: 14,
    color: '#78827B',
    marginTop: 8,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34443A',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DCE5DE',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#26352B',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },

  button: {
    height: 52,
    backgroundColor: '#23834D',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  footer: {
    textAlign: 'center',
    color: '#23834D',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 35,
  },
});
