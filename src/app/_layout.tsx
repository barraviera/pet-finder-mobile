
import { useEffect } from 'react';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status, checkSession } = useAuth();

  const segments = useSegments();
  const router = useRouter();

  const firstSegment = segments[0];

  const isPublicRoute =
    firstSegment === 'login' ||
    firstSegment === 'register';

  useEffect(() => {
    if (status === 'loading' || status === 'error') {
      return;
    }

    if (
      status === 'unauthenticated' &&
      !isPublicRoute
    ) {
      router.replace('/login');
    }

    if (
      status === 'authenticated' &&
      (isPublicRoute || !firstSegment)
    ) {
      router.replace('/home');
    }
  }, [status, isPublicRoute, firstSegment, router]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#23834D" />
        <Text style={styles.message}>
          Verificando sua sessão...
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          Não foi possível conectar
        </Text>

        <Text style={styles.message}>
          Verifique sua conexão e tente novamente.
        </Text>

        <Pressable
          style={styles.button}
          onPress={checkSession}
        >
          <Text style={styles.buttonText}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <AnimatedSplashOverlay />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="create-sighting" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      {/* Agora o RootNavigator e todas as telas que ele renderiza conseguem acessar o contexto de autenticação. */}
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F8F5',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#26352B',
    marginBottom: 10,
  },

  message: {
    color: '#66736A',
    marginTop: 12,
    textAlign: 'center',
  },

  button: {
    marginTop: 24,
    backgroundColor: '#23834D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
