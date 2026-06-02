/**
 * Neutral module that holds a pending notification tap that arrived before
 * auth routing settled.  Imported by both app/_layout.tsx (writes) and
 * services/auth/authStateManager.ts (drains), breaking the circular dependency
 * that would result from those two modules importing each other directly.
 */

import { router } from 'expo-router';

interface NotificationTapData {
  screen?: string;
  bookingId?: string;
}

/** Stores at most one pending tap at a time. */
export const pendingNotificationRef: { data: NotificationTapData | null } = {
  data: null,
};

/** Navigate to the screen referenced in push-notification payload data. */
export function handleNotificationTapGlobal(data: NotificationTapData): void {
  if (!data.screen) return;

  const routes: Record<string, string> = {
    RequestsTab: '/priest/(tabs)/RequestsTab',
    CalendarTab:  '/priest/(tabs)/CalendarTab',
    EarningsTab:  '/priest/(tabs)/EarningsTab',
    BookingsTab:  '/devotee/(tabs)/BookingsTab',
    ExploreTab:   '/devotee/(tabs)/ExploreTab',
    BookingDetails: '/devotee/(screens)/BookingDetails',
  };

  const route = routes[data.screen];
  if (!route) return;

  if (data.screen === 'BookingDetails' && data.bookingId) {
    router.push({
      pathname: route as any,
      params: { bookingId: data.bookingId },
    });
  } else {
    router.push(route as any);
  }
}

/**
 * Apply any stored notification tap, then clear the ref.
 * Called by authStateManager after every router.replace() so the tap is
 * applied once the destination screen is mounted.
 */
export function drainPendingNotification(): void {
  const data = pendingNotificationRef.data;
  pendingNotificationRef.data = null;
  if (data) {
    handleNotificationTapGlobal(data);
  }
}
