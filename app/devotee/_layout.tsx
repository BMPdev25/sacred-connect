import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "../../constants/Colors";
import {
  NotificationProvider,
  useNotifications,
} from "../../context/NotificationContext";

// ─── Notification Bell (reused from priest pattern) ───────────────────────
const NotificationBell = () => {
  const { unreadCount, toggleNotifications, showNotifications } =
    useNotifications();

  return (
    <TouchableOpacity
      style={{ position: "relative", padding: 4 }}
      onPress={toggleNotifications}
    >
      <Ionicons
        name={showNotifications ? "notifications" : "notifications-outline"}
        size={22}
        color={APP_COLORS.bodyText}
      />
      {unreadCount > 0 && <View style={styles.notifBadge} />}
    </TouchableOpacity>
  );
};

// ─── Notification Overlay Dropdown ────────────────────────────────────────
const NotificationOverlay = () => {
  const { showNotifications, closeNotifications, notifications } =
    useNotifications();
  const insets = useSafeAreaInsets();

  if (!showNotifications) return null;

  const topInset = insets.top + (Platform.OS === "ios" ? 44 : 56);

  const handleNotificationPress = (notification: any) => {
    closeNotifications();
    if (notification.type === "booking" && notification.data) {
      router.push({
        pathname: "/BookingDetails",
        params: { booking: JSON.stringify(notification.data) },
      });
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={closeNotifications} />
      <View style={[styles.floatingContainer, { top: topInset }]}>
        <View style={styles.notifArrow} />
        <View style={styles.notifCard}>
          <Text style={styles.notifTitle}>Notifications</Text>
          <ScrollView
            style={styles.notifList}
            showsVerticalScrollIndicator={true}
          >
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.notifItem,
                    !n.read && styles.unreadNotification,
                  ]}
                  onPress={() => handleNotificationPress(n)}
                >
                  <View style={styles.notifDot} />
                  <Text style={styles.notifMessage}>{n.message}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noNotifsText}>No new notifications</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

// ─── Tab Navigator ────────────────────────────────────────────────────────
const DevoteeTabs = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_COLORS.saffron,
        tabBarInactiveTintColor: APP_COLORS.gray,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="(tabs)/HomeTab"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ExploreTab"
        options={{
          title: "Explore",
          tabBarLabel: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/BookingsTab"
        options={{
          title: "Bookings",
          tabBarLabel: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ProfileTab"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

// ─── Root Layout (wraps tabs + notification overlay) ──────────────────────
export default function DevoteeLayout() {
  return (
    <NotificationProvider>
      <DevoteeTabs />
      <NotificationOverlay />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: APP_COLORS.surface,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    height: Platform.OS === "ios" ? 92 : 72,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  // Notification badge
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: APP_COLORS.error,
    borderWidth: 1,
    borderColor: APP_COLORS.surface,
  },

  // Floating overlay
  floatingContainer: {
    position: "absolute",
    right: 16,
    zIndex: 2000,
    width: "60%",
    maxHeight: "55%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    alignItems: "flex-end",
  },
  notifArrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: APP_COLORS.surface,
    marginRight: 12,
  },
  notifCard: {
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    padding: 14,
    width: "100%",
    maxHeight: "100%",
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: APP_COLORS.headingText,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.divider,
    paddingBottom: 6,
  },
  notifList: {
    maxHeight: 250,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: APP_COLORS.divider,
  },
  unreadNotification: {
    backgroundColor: APP_COLORS.saffronLight,
  },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.saffron,
    marginRight: 10,
  },
  notifMessage: {
    fontSize: 13,
    color: APP_COLORS.bodyText,
    flex: 1,
    lineHeight: 18,
  },
  noNotifsText: {
    textAlign: "center",
    color: APP_COLORS.gray,
    fontSize: 13,
    padding: 16,
  },
});
