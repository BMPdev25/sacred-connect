import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useColorScheme } from "react-native";
import { Provider } from "react-redux";
import store from "../redux/store";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            {/* Register screens/stacks used by the app so routes are available */}
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(devotee)" options={{ headerShown: false }} />
            <Stack.Screen name="(priest)" options={{ headerShown: false }} />
          </Stack>
        </>
      </ThemeProvider>
    </Provider>
  );
}
