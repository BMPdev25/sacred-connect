import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { THEME } from '@/constants/theme';
import {
  AppNotification,
  fetchNotifications,
  markAsRead,
  markAllRead,
} from '@/services/notifications/notificationService';

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TYPE_CONFIG = {
  booking: { icon: 'calendar-outline' as const, color: THEME.colors.primary, bg: '#FFF3E0' },
  payment: { icon: 'cash-outline' as const, color: '#16A34A', bg: '#DCFCE7' },
  system: { icon: 'information-circle-outline' as const, color: '#2563EB', bg: '#DBEAFE' },
};

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
}) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;

  return (
    <TouchableOpacity
      style={[styles.card, item.read ? styles.cardRead : styles.cardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.cardTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationCenter(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchNotifications('devotee');
      setNotifications(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkAll = async () => {
    await markAllRead('devotee');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handlePress = async (item: AppNotification) => {
    if (!item.read) {
      await markAsRead(item._id, 'devotee').catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );
    }
    if (item.relatedId) {
      if (item.type === 'booking') {
        router.push({
          pathname: '/devotee/(screens)/BookingDetails' as any,
          params: { bookingId: item.relatedId },
        });
      } else if (item.type === 'payment') {
        router.push({
          pathname: '/devotee/(screens)/BookingDetails' as any,
          params: { bookingId: item.relatedId },
        });
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: insets.top + 56, paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerHeading}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={THEME.colors.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyFill : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[THEME.colors.primary]}
            />
          }
          renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={56} color={THEME.colors.textMuted} />
              <Text style={styles.emptyHeading}>No notifications yet</Text>
              <Text style={styles.emptyBody}>Booking updates will appear here</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { marginRight: 8, marginBottom: 2 },
  headerHeading: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  markAllBtn: { paddingVertical: 4 },
  markAllText: { fontSize: 13, color: THEME.colors.primary, fontWeight: '600' },
  loader: { marginTop: 48 },
  listContent: { padding: 16 },
  emptyFill: { flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: THEME.colors.primary },
  cardRead: { opacity: 0.7 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, paddingHorizontal: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: THEME.colors.textPrimary },
  cardMessage: { fontSize: 13, color: THEME.colors.textSecondary, marginTop: 2 },
  cardTime: { fontSize: 12, color: THEME.colors.textMuted, marginTop: 4 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: { fontSize: 14, color: THEME.colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
