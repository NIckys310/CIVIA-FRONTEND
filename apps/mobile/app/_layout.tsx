import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useBootstrap, useInactivityLock } from '@/bootstrap';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const { c, scheme } = useTheme();
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  useBootstrap();
  useInactivityLock();

  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'fade' }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
