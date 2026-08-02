/**
 * AuthLayout component - Root stack navigator for the authentication flow group.
 * Configures transitions and hides headers for all splash, onboarding, role,
 * credentials, OTP, and password screens.
 */

import React from 'react';

import { Stack } from 'expo-router';

/**
 * Authentication Stack Layout component. Defines file-based routing routes
 * within the (auth) directory with header titles hidden.
 * 
 * @returns React Element rendering the Stack Router layout.
 */
export default function AuthLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup-devotee" />
      <Stack.Screen name="signup-priest" />
      <Stack.Screen name="otp-verify" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
