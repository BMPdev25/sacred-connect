import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
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
        name="(tabs)/HomeTab"
        options={{
          title: "Home",
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/BookingsTab"
        options={{
          title: "Bookings",
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ProfileTab"
        options={{
          title: "Profile",
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
