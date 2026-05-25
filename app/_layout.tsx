import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { THEME } from '@/constants/theme';

/**
 * Root Stack component. Applies safe area top padding dynamically 
 * to shift all navigation screens below the phone's top status bar/notch.
 */
function RootStack(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="devotee/index" />
        <Stack.Screen name="priest/index" />
        <Stack.Screen name="priest/onboarding" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

/**
 * Main application Root Layout. Wraps the app in the SafeAreaProvider
 * and mounts the top-padded Root Stack router.
 */
export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <RootStack />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
