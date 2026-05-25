import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/constants/theme';

/**
 * Root entry component that programmatically redirects the user to the splash screen
 * after a small delay to ensure the Expo Router navigation tree is fully initialized.
 */
export default function Index(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    console.log('[DEBUG] Root index page mounted. Initializing redirect to /splash...');
    const timer = setTimeout(() => {
      console.log('[DEBUG] Root index: Redirecting to /splash');
      router.replace('/splash');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={THEME.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
});
