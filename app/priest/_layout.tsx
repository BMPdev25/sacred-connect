import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { APP_COLORS } from "../../constants/Colors";

export default function PriestLayout() {
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/RequestsTab"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ScheduleTab"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/EarningsTab"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/NotificationsTab"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="notifications-outline"
              size={size || 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ProfileTab"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/BookingsTab"
        options={{
          href: null, // Hide this from tab bar, but keep route accessible if needed
        }}
      />
    </Tabs>
  );
}
