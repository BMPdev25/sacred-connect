import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Provider } from "react-redux";
import store from "../redux/store";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setLogoutCallback } from "../api";
import { logout } from "../redux/slices/authSlice";
import { usePushNotifications } from "../hooks/usePushNotifications";
import authService from "../services/authServices";

import { SocketProvider } from "../context/SocketContext";
import { NotificationProvider } from "../context/NotificationContext";

const queryClient = new QueryClient();

function AppContent() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const { userToken } = useAppSelector((state) => state.auth);
  
  // Register for push notifications
  const { expoPushToken } = usePushNotifications();

  // Set up logout callback for API interceptor
  useEffect(() => {
    setLogoutCallback(() => {
      dispatch(logout());
    });
  }, [dispatch]);

  // Sync Push Token to Backend when authenticated
  useEffect(() => {
    const syncToken = async () => {
      if (userToken && expoPushToken?.data) {
        await authService.savePushToken(expoPushToken.data);
        console.log("Push token synced to backend:", expoPushToken.data);
      }
    };
    syncToken();
  }, [userToken, expoPushToken]);

  return (
    <SocketProvider>
      <NotificationProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              {/* Register screens/stacks used by the app so routes are available */}
              {/* <Stack.Screen name="splash" options={{ headerShown: false }} /> */}
              {/* <Stack.Screen name="(auth)" options={{ headerShown: false }} /> */}
              {/* <Stack.Screen name="(devotee)" options={{ headerShown: false }} /> */}
              {/* <Stack.Screen name="(priest)" options={{ headerShown: false }} /> */}
            </Stack>
          </>
        </ThemeProvider>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </Provider>
  );
}
