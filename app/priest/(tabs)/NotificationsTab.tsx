import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";

const HEADER_TOP_PADDING = Platform.OS === "android" ? 24 : 44;

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await priestService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Don't show alert for no notifications, just set empty array
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await priestService.markNotificationAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await priestService.markAllNotificationsAsRead();
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      Alert.alert("Error", "Failed to mark all notifications as read");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  const renderNotificationItem = ({ item }: { item: any }) => {
    let iconName;
    let iconColor;

    switch (item.type) {
      case "booking":
        iconName = "calendar";
        iconColor = APP_COLORS.primary;
        break;
      case "payment":
        iconName = "wallet";
        iconColor = APP_COLORS.success;
        break;
      case "reminder":
        iconName = "alarm";
        iconColor = APP_COLORS.warning;
        break;
      default:
        iconName = "notifications";
        iconColor = APP_COLORS.gray;
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.unreadNotification,
        ]}
        onPress={() => {
          // Mark as read if not already read
          if (!item.read) {
            markAsRead(item._id);
          }

          // Handle notification tap
          if (item.type === "booking") {
            router.push("/priest/BookingsTab");
          } else if (item.type === "payment") {
            router.push("/priest/EarningsTab");
          }
        }}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}
        >
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView>
      <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
        <View
          style={[
            styles.header,
            {
              paddingTop: HEADER_TOP_PADDING,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 4,
              borderBottomWidth: 1,
              borderBottomColor: APP_COLORS.lightGray,
            },
          ]}
        >
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={APP_COLORS.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.notificationsList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off"
              size={60}
              color={APP_COLORS.lightGray}
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll be notified about new bookings, payments, and reminders.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    // Top padding is now handled dynamically
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 22,
    fontWeight: "bold",
  },
  markAllText: {
    color: APP_COLORS.primary,
    fontWeight: "500",
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  notificationTime: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  notificationMessage: {
    fontSize: 14,
    color: APP_COLORS.black,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: APP_COLORS.gray,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: APP_COLORS.gray,
    marginTop: 16,
  },
});

export default NotificationsScreen;
