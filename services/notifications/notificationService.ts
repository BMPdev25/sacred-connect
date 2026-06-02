import api from '@/api';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'system';
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

export async function fetchNotifications(
  role: 'priest' | 'devotee'
): Promise<AppNotification[]> {
  const path = role === 'priest' ? '/priest/notifications' : '/devotee/notifications';
  const res = await api.get(path);
  return res.data?.data || res.data || [];
}

export async function markAsRead(
  notificationId: string,
  role: 'priest' | 'devotee'
): Promise<void> {
  const path =
    role === 'priest'
      ? `/priest/notifications/${notificationId}/read`
      : `/devotee/notifications/${notificationId}/read`;
  await api.put(path);
}

export async function markAllRead(role: 'priest' | 'devotee'): Promise<void> {
  const path =
    role === 'priest'
      ? '/priest/notifications/mark-all-read'
      : '/devotee/notifications/mark-all-read';
  await api.put(path);
}

/**
 * Returns the number of unread notifications for the given role.
 *
 * Strategy (Bug 5 fix):
 *  1. Try the lightweight dedicated endpoint first:
 *       GET /priest/notifications/unread-count  →  { count: N }
 *     This avoids downloading up to 50 full documents just for a badge number.
 *  2. If the backend returns 404 (endpoint not yet deployed) fall back to the
 *     full-fetch and client-side count, so behaviour degrades gracefully.
 */
export async function getUnreadCount(role: 'priest' | 'devotee'): Promise<number> {
  const countPath =
    role === 'priest'
      ? '/priest/notifications/unread-count'
      : '/devotee/notifications/unread-count';

  try {
    const res = await api.get(countPath);
    const count = res.data?.data?.count ?? res.data?.count;
    if (typeof count === 'number') {
      return count;
    }
    // Unexpected shape — fall through to full-fetch
  } catch (err: any) {
    const status = err?.response?.status;
    if (status !== 404) {
      // Propagate unexpected errors so callers can handle them
      throw err;
    }
    // 404 means the endpoint doesn't exist yet — fall back
  }

  // Fallback: full-fetch + client-side filter
  const notifications = await fetchNotifications(role);
  return notifications.filter((n) => !n.read).length;
}
