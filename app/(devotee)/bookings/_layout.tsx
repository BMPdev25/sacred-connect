import { Stack } from 'expo-router';
import React from 'react';

export default function BookingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="BookingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="BookingDetails" options={{ headerShown: false }} />
    </Stack>
  );
}
