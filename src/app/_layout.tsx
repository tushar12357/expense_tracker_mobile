import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { AuthProvider, useAuth } from '@/providers/auth';
import { ToastProvider } from '@/providers/toast';

SplashScreen.preventAutoHideAsync().catch(() => {});

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, err) => !(err instanceof ApiError && err.status > 0 && err.status < 500) && count < 2,
      },
    },
  });
}

function Routes() {
  const { user, booting } = useAuth();
  const t = useTheme();

  useEffect(() => {
    if (!booting) SplashScreen.hideAsync().catch(() => {});
  }, [booting]);

  if (booting) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: 'slide_from_right' }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transaction/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="transaction/[id]" />
        <Stack.Screen name="accounts" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="rules" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="security" />
        <Stack.Screen name="imports/index" />
        <Stack.Screen name="imports/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="imports/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [client] = useState(makeClient);
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Routes />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
