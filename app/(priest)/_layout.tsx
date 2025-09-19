import { Stack } from 'expo-router';
import React from 'react';

export default function PriestLayout() {
	return (
		<Stack>
			<Stack.Screen name="home" options={{ headerShown: false }} />
			<Stack.Screen name="Bookings" options={{ headerShown: false }} />
			<Stack.Screen name="Earnings" options={{ headerShown: false }} />
			<Stack.Screen name="Profile" options={{ headerShown: false }} />
			<Stack.Screen name="Notifications" options={{ headerShown: false }} />
		</Stack>
	);
}
