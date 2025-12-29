import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Provider, useDispatch } from "react-redux";
import store from "../redux/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setLogoutCallback } from "../api";
import { logout } from "../redux/slices/authSlice";

const queryClient = new QueryClient();

function AppContent() {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();

  // Set up logout callback for API interceptor
  useEffect(() => {
    setLogoutCallback(() => {
      dispatch(logout());
    });
  }, [dispatch]);

  return (
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
