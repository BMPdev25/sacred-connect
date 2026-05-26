import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Devotee entry point — immediately redirects to the tab navigator (HomeTab).
 * Kept as a named route so the root Stack can register it.
 */
export default function DevoteeIndex(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/devotee/(tabs)/HomeTab' as any);
  }, [router]);

  return null;
}

