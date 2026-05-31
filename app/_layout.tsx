import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store } from '@/redux/store';
import { queryClient } from '@/lib/queryClient';
import { THEME } from '@/constants/theme';
import { initializeAuthListener } from '@/services/auth/authStateManager';

/**
 * Root Stack component. Applies safe area top padding dynamically 
 * to shift all navigation screens below the phone's top status bar/notch.
 */
function RootStack(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('[DEBUG] RootStack: Subscribing to auth state change observer...');
    const unsubscribe = initializeAuthListener();
    return () => {
      console.log('[DEBUG] RootStack: Cleaning up auth state observer...');
      unsubscribe();
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="devotee/index" />
        <Stack.Screen name="devotee/(tabs)" />
        <Stack.Screen name="priest/index" />
        <Stack.Screen name="priest/onboarding" />
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
