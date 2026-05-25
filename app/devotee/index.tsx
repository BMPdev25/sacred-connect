import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { logout } from '@/services/auth/authService';
import { AssetService } from '@/services/assets/AssetService';

/**
 * Devotee Home Screen stub.
 */
export default function DevoteeIndex(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    console.log('[DEBUG] Devotee Dashboard Screen mounted.');
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('[DEBUG] Devotee Dashboard: Sign out pressed');
      setLoading(true);
      await logout();
      console.log('[DEBUG] Devotee Dashboard: Logout success, redirecting to /login');
      router.replace('/login');
    } catch (err) {
      console.log('[DEBUG] Devotee Dashboard: Logout failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={AssetService.getImage('shared.logo')}
        style={styles.logo}
      />
      <Text style={styles.title}>Devotee Dashboard (Stub)</Text>
      <Text style={styles.subtitle}>Welcome to Sacred Connect Devotee Screen</Text>
      <View style={styles.btnWrap}>
        <PrimaryButton
          title="Sign Out"
          onPress={handleSignOut}
          loading={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.lg,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.typography.heading,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xl,
  },
  btnWrap: {
    width: '100%',
  },
});
