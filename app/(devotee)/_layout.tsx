import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { APP_COLORS } from "../../constants/Colors";

export default function DevoteeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_COLORS.primary,
        tabBarStyle: { backgroundColor: APP_COLORS.white },
      }}
    >
      <Tabs.Screen
        name="HomeScreen"
        options={{
          title: "Home",
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: () => <Text>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "Profile",
          tabBarIcon: () => <Text>👤</Text>,
        }}
      />
    </Tabs>
  );
}
