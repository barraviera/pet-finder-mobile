
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
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  // Estados dos campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estado para controlar o carregamento
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();

  // Executa o login
  async function handleLogin() {
    // Validamos campos do formulário
    if (!email.trim() || !password) {
      Alert.alert(
        'Atenção',
        'Informe seu e-mail e sua senha.',
      );
      return;
    }

    try {
      setLoading(true);

      await signIn({
        email: email.trim(),
        password,
      });

      // Login realizado: segue para a tela inicial
      router.replace('/home');

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert(
            'Login inválido',
            'Verifique seu e-mail e sua senha.',
          );
        } else if (!error.response) {
          Alert.alert(
            'Erro de conexão',
            'Não foi possível conectar ao servidor.',
          );
        } else {
          Alert.alert(
            'Erro',
            'Não foi possível realizar o login.',
          );
        }
      } else {
        Alert.alert(
          'Erro',
          'Ocorreu um erro inesperado.',
        );
      }
    } finally { //O finally é executado independentemente de a requisição ter dado certo ou errado
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
            Bem-vindo!
          </Text>

          <Text style={styles.description}>
            Entre na sua conta para continuar.
          </Text>

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
            placeholder="Sua senha"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
          />

          {/* Quando o usuário clicar em Entrar, executar a função handleLogin */}
          <Pressable
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Entrar
              </Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          PetFinder — Juntos pelos animais.
        </Text>
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
    color: '#89938B',
    fontSize: 12,
    marginTop: 35,
  },
});
