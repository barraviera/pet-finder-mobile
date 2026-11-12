import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {

  // Estamos obtendo duas informações do contexto global:
  // user: dados do usuário autenticado.
  // signOut: função responsável por encerrar a sessão.
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza de que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Primeiro encerramos a sessão.
              await signOut();
              // Depois direcionamos o usuário para o login.
              router.replace('/login');
            } catch (error) {
              console.error('Erro ao sair:', error);
              Alert.alert(
                'Erro',
                'Não foi possível sair da conta. Tente novamente.',
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{user?.name ?? 'Não informado'}</Text>

        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{user?.email ?? 'Não informado'}</Text>

        <Text style={styles.label}>Perfil</Text>
        <Text style={styles.value}>{user?.role ?? 'Não informado'}</Text>
      </View>

      <Pressable
        style={[styles.logoutButton, loading && styles.disabledButton]}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F5',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#26352B',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
  },
  label: {
    fontSize: 13,
    color: '#78827B',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#26352B',
    marginTop: 4,
  },
  logoutButton: {
    height: 52,
    backgroundColor: '#D64545',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});