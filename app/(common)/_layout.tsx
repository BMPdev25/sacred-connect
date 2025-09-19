import { Stack } from 'expo-router';
import React from 'react';

export default function CommonLayout() {
	return (
		<Stack>
			<Stack.Screen name="HelpScreen" options={{ headerShown: false }} />
		</Stack>
	);
}
