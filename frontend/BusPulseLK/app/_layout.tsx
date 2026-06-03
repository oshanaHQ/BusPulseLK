import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'SafeAreaView has been deprecated',
]);
import * as Notifications from 'expo-notifications';
import {
  setupNotifications,
  requestPermissions,
  ACTION_MARK_PASSED,
  setWorkerLastAction,
} from '../services/notificationService';
import { tripService } from '../services/api';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Route guard ────────────────────────────────────────────────────────────────
// Runs inside AuthProvider so it can read auth state.

function RouteGuard() {
  const { isAuthenticated, isLoading, user, isGuest } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait until AsyncStorage has been read

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in — send to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Already logged in — redirect to correct dashboard
      // Handle both camelCase and PascalCase just in case from the backend
      const role = (user?.role || (user as any)?.Role || '').toLowerCase();
      
      switch (role) {
        case 'passenger':
          // Guests go straight to the search screen, registered passengers to the home dashboard
          router.replace(isGuest ? '/passenger/(tabs)/search' : '/passenger');
          break;
        case 'busowner':
          router.replace('/owner/dashboard');
          break;
        case 'admin':
          router.replace('/admin/dashboard');
          break;
        case 'driver':
        case 'conductor':
          router.replace('/worker/dashboard');
          break;
        default:
          // If role is unknown, maybe logout and go back to login
          console.warn('Unknown user role:', role);
          router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  // Show spinner while reading stored session
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FF6200" />
      </View>
    );
  }

  return null;
}

// ── Root layout ────────────────────────────────────────────────────────────────

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Setup notification channels, categories, and permissions
    setupNotifications().then(() => requestPermissions());

    // Handle notification action responses (e.g. worker taps "Mark Passed")
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data as any;

      if (actionIdentifier === ACTION_MARK_PASSED && data?.tripId && data?.nextStopTownId) {
        try {
          await tripService.updateProgress(Number(data.tripId), Number(data.nextStopTownId));
          await setWorkerLastAction({ townId: Number(data.nextStopTownId), timestamp: Date.now() });
        } catch (e) {
          console.log('Error marking stop from notification:', e);
        }
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RouteGuard />
        <Stack>
          {/* AUTH STACK (login, register) */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* TAB STACK */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* ROLE STACKS */}
          <Stack.Screen name="passenger" options={{ headerShown: false }} />
          <Stack.Screen name="admin"     options={{ headerShown: false }} />
          <Stack.Screen name="worker"    options={{ headerShown: false }} />
          <Stack.Screen name="owner"     options={{ headerShown: false }} />

          {/* MODAL */}
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
