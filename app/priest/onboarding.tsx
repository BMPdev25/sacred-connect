import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import PrimaryButton from '@/components/shared/PrimaryButton';
import { THEME } from '@/constants/theme';
import { logout } from '@/services/auth/authService';
import { AssetService } from '@/services/assets/AssetService';

/**
 * Priest Onboarding Screen stub.
 */
export default function PriestOnboarding(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    console.log('[DEBUG] Priest Onboarding Screen mounted.');
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('[DEBUG] Priest Onboarding: Sign out pressed');
      setLoading(true);
      await logout();
      console.log('[DEBUG] Priest Onboarding: Logout success, redirecting to /login');
      router.replace('/login');
    } catch (err) {
      console.log('[DEBUG] Priest Onboarding: Logout failed', err);
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
      <Text style={styles.title}>Priest Onboarding (Stub)</Text>
      <Text style={styles.subtitle}>Complete your profile setup</Text>
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
