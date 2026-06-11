import '../global.css';
import '../i18n';

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';

import { AuthProvider, useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const topSegment = segments[0];
    const inProtectedGroup =
      topSegment === '(tabs)' ||
      topSegment === 'settings' ||
      topSegment === 'course' ||
      topSegment === 'study';
    const inPublicGroup = topSegment === 'landing' || topSegment === 'auth';

    if (!user && inProtectedGroup) {
      router.replace('/landing');
    } else if (user && inPublicGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F49F6F" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="landing" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Réglages', presentation: 'modal' }} />
      <Stack.Screen name="course/[eventId]" options={{ headerShown: true, title: 'Cours' }} />
      <Stack.Screen name="study/[fileId]" options={{ headerShown: true, title: 'Étude' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
