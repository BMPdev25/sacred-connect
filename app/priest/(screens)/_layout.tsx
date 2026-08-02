import React from 'react';
import { Stack } from 'expo-router';

/**
 * Priest screens Stack layout.
 * All screens inside app/priest/(screens)/ are rendered as push-navigated
 * cards on top of the tab navigator. Header is hidden — each screen owns its
 * own back button per the project Back Button Rule.
 */
export default function PriestScreensLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
