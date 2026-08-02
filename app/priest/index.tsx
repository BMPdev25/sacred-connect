import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Priest entry point — immediately redirects to the tab navigator (HomeTab).
 * Kept as a named route so the root Stack can register it.
 */
export default function PriestIndex(): null {
  const router = useRouter();

  useEffect(() => {
    router.replace('/priest/(tabs)/HomeTab' as any);
  }, [router]);

  return null;
}
