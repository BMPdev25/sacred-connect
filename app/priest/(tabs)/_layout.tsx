import React from 'react';
import { Tabs } from 'expo-router';
import PriestTabBar from '@/components/shared/PriestTabBar';

export default function PriestTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PriestTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="HomeTab" options={{ title: 'Home' }} />
      <Tabs.Screen name="RequestsTab" options={{ title: 'Requests' }} />
      <Tabs.Screen name="CalendarTab" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="EarningsTab" options={{ title: 'Earnings' }} />
      <Tabs.Screen name="ProfileTab" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
