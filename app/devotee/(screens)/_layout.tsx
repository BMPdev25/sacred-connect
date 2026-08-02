import React from 'react';
import { Stack } from 'expo-router';

/**
 * Devotee screens Stack layout.
 * All screens inside app/devotee/(screens)/ are rendered as push-navigated
 * cards on top of the tab navigator. Header is hidden — each screen owns its
 * own back button per the project Back Button Rule.
 */
export default function DevoteeScreensLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
