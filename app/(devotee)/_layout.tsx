import { Stack } from 'expo-router';
import React from 'react';

export default function DevoteeLayout() {
	return (
		<Stack>
			<Stack.Screen name="home" options={{ headerShown: false }} />
			<Stack.Screen name="PriestSearch" options={{ headerShown: false }} />
			<Stack.Screen name="PriestDetails" options={{ headerShown: false }} />
			<Stack.Screen name="Booking" options={{ headerShown: false }} />
			<Stack.Screen name="Bookings" options={{ headerShown: false }} />
			<Stack.Screen name="Profile" options={{ headerShown: false }} />
			<Stack.Screen name="TermsAndConditionScreen" options={{ title: 'Terms', headerShown: false }} />
		</Stack>
	);
}
