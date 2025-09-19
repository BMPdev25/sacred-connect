import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider, useSelector } from 'react-redux';
import store, { RootState } from '../redux/store';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Start app on the splash screen before showing the main tabs.
  initialRouteName: 'splash',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a wrapper component for authentication check
interface AuthCheckProps {
  children: React.ReactNode;
}

function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter();
  const userInfo = useSelector((state: RootState) => state.auth.userInfo);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!userInfo?.token) {
      router.replace('/(auth)/login' as any);
    } else {
      if (userInfo.userType === 'devotee') {
        // router.replace('');
      } else if (userInfo.userType === 'priest') {
        // router.replace('/(priest)/home');
      }
    }
  }, [userInfo]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthCheck>
          <Stack>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            {/* <Stack.Screen name="(devotee)" options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="(priest)" options={{ headerShown: false }} /> */}
          </Stack>
        </AuthCheck>
      </ThemeProvider>
    </Provider>
  );
}
