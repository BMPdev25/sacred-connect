import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { store } from '@/redux/store';
import { queryClient } from '@/lib/queryClient';
import { THEME } from '@/constants/theme';
import { initializeAuthListener } from '@/services/auth/authStateManager';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Holds a notification tap that arrived before auth routing settled (Bug 2 fix). */
const pendingNotificationRef = { data: null as { screen?: string; bookingId?: string } | null };

/**
 * Called by authStateManager after router.replace() so any pending notification
 * tap recorded before auth routing settled is applied to the final screen.
 */
export function drainPendingNotification(): void {
  const data = pendingNotificationRef.data;
  pendingNotificationRef.data = null;
  if (data) {
    handleNotificationTapGlobal(data);
  }
}

/** Routes to the screen referenced in push notification data. */
function handleNotificationTapGlobal(data: { screen?: string; bookingId?: string }): void {
  if (!data.screen) return;

  const routes: Record<string, string> = {
    RequestsTab: '/priest/(tabs)/RequestsTab',
    CalendarTab: '/priest/(tabs)/CalendarTab',
    EarningsTab: '/priest/(tabs)/EarningsTab',
    BookingsTab: '/devotee/(tabs)/BookingsTab',
    ExploreTab: '/devotee/(tabs)/ExploreTab',
    BookingDetails: '/devotee/(screens)/BookingDetails',
  };

  const route = routes[data.screen];
  if (!route) return;

  if (data.screen === 'BookingDetails' && data.bookingId) {
    router.push({
      pathname: route as any,
      params: { bookingId: data.bookingId },
    });
  } else {
    router.push(route as any);
  }
}

function RootStack(): React.JSX.Element {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    console.log('[DEBUG] RootStack: Subscribing to auth state change observer...');
    const unsubscribe = initializeAuthListener();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        screen?: string;
        bookingId?: string;
      };
      // Store in ref so auth routing (which may still be in-flight) doesn't
      // overwrite this navigation with a router.replace (Bug 2 fix).
      pendingNotificationRef.data = data;
    });

    // Bug 1 fix: handle cold-start tap that fired before JS mounted.
    // expo-notifications consumes the initial response during launch;
    // the listener above will never fire for it.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as {
          screen?: string;
          bookingId?: string;
        };
        pendingNotificationRef.data = data;
      }
    });

    return () => {
      console.log('[DEBUG] RootStack: Cleaning up auth state observer...');
      unsubscribe();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="devotee/index" />
        <Stack.Screen name="devotee/(tabs)" />
        <Stack.Screen name="devotee/(screens)" />
        <Stack.Screen name="priest/index" />
        <Stack.Screen name="priest/onboarding" />
        <Stack.Screen name="priest/(screens)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

/**
 * Main application Root Layout. Wraps the app in the SafeAreaProvider,
 * QueryClientProvider, and mounts the top-padded Root Stack router.
 */
export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <RootStack />
          </SafeAreaProvider>
        </QueryClientProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
