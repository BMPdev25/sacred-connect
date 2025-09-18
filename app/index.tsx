import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function IndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Ensure the app always starts at the splash screen
    router.replace('/splash');
  }, []);

  return null;
}
