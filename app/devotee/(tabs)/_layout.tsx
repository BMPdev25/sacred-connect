import React from 'react';
import { Tabs } from 'expo-router';
import DevoteeTabBar from '@/components/shared/DevoteeTabBar';

/**
 * Devotee tab navigator layout.
 * Mounts the custom DevoteeTabBar and declares the four main devotee screens.
 */
export default function DevoteeTabLayout(): React.JSX.Element {
  return (
    <Tabs
      tabBar={(props) => <DevoteeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="ExploreTab"
        options={{ title: 'Explore' }}
      />
      <Tabs.Screen
        name="BookingsTab"
        options={{ title: 'Bookings' }}
      />
      <Tabs.Screen
        name="ProfileTab"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}
