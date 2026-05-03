import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "../../constants/Colors";
import { NotificationProvider, useNotifications } from "../../context/NotificationContext";

const NotificationBell = ({ color }: { color: string }) => {
  const { unreadCount, toggleNotifications, showNotifications } = useNotifications();

  return (
    <TouchableOpacity
      style={{ marginRight: 16, position: "relative" }}
      onPress={toggleNotifications}
    >
      <Ionicons
        name={showNotifications ? "notifications" : "notifications-outline"}
        size={24}
        color={color}
      />
      {unreadCount > 0 && (
        <View style={styles.notificationBadge} />
      )}
    </TouchableOpacity>
  );
};

const NotificationOverlay = () => {
  const { showNotifications, closeNotifications, notifications } = useNotifications();
  const insets = useSafeAreaInsets();

  if (!showNotifications) return null;

  // Calculate top position based on platform and safe area
  // Header height is typically ~56-64dp depending on platform + status bar
  const hasCustomHeader = false; // logic dependent on active tab, but simplified global
  const topInset = insets.top + (Platform.OS === 'ios' ? 44 : 56);

  const handleNotificationPress = (notification: any) => {
    closeNotifications();
    if (notification.type === 'booking') {
      // Try every possible location the bookingId could be stored
      const bookingId =
        notification.data?._id ||
        notification.data?.bookingId ||
        notification.relatedId ||
        notification.data?.relatedId;

      if (bookingId) {
        router.push({
          pathname: "/priest/(priestScreens)/PujaRequestDetails",
          params: { bookingId },
        } as any);
      }
    } else if (notification.type === 'earnings') {
      router.push("/priest/(tabs)/EarningsTab" as any);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Transparent Backdrop to detect outside clicks */}
      <Pressable style={StyleSheet.absoluteFill} onPress={closeNotifications} />

      {/* Modal Content */}
      <View style={[styles.floatingNotificationContainer, { top: topInset }]}>
        <View style={styles.notificationArrow} />
        <View style={styles.notificationCard}>
          <Text style={styles.notificationTitle}>Notifications</Text>
          <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={true}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notificationItem, !n.read && styles.unreadNotification]}
                  onPress={() => handleNotificationPress(n)}
                >
                  <View style={styles.notificationDot} />
                  <Text style={styles.notificationMessage}>{n.message}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noNotificationsText}>No new notifications</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const PriestTabs = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: true, // Default to true so standard tabs get headers
        headerStyle: { backgroundColor: APP_COLORS.primary },
        headerTintColor: APP_COLORS.white,
        tabBarActiveTintColor: APP_COLORS.primary,
        tabBarStyle: { backgroundColor: APP_COLORS.white },
        headerRight: ({ tintColor }) => <NotificationBell color={tintColor || APP_COLORS.white} />, // ensure bell is white or matches text
      }}
    >
      <Tabs.Screen
        name="(tabs)/HomeTab"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/CalendarTab"
        options={{
          title: "Calendar",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ServicesTab"
        options={{
          href: null,
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/EarningsTab"
        options={{
          title: "Earnings",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/ProfileTab"
        options={{
          title: "Menu",
          headerShown: false,
          headerRight: () => null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size || 20} color={color} />
          ),
        }}
      />
      {/* Hidden Tabs */}
      <Tabs.Screen
        name="(tabs)/NotificationsTab"
        options={{
          href: null,
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="notifications-outline"
              size={size || 20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(tabs)/RequestsTab"
        options={{
          href: null,
          title: "Requests",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/ServiceDetailScreen"
        options={{
          href: null,
          title: "Service Details",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/AddServiceScreen"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="weekly-schedule"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/ProfileSetup"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/PujaRequestDetails"
        options={{
          href: null,
          title: "Puja Request",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="(priestScreens)/AvailableOffers"
        options={{
          href: null,
          title: "Available Offers",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/DocumentUpload"
        options={{
          href: null,
          title: "Upload Documents",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/VerificationStatus"
        options={{
          href: null,
          title: "Verification Status",
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/AvailabilitySetup"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="(priestScreens)/OnboardingWizard"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

import { useSocket } from "../../context/SocketContext";
import priestService from "../../services/priestService";
import IncomingRequestModal from "../../components/IncomingRequestModal";
import { Alert } from "react-native";

import { useAppSelector } from "../../redux/hooks";

export default function PriestLayout() {
  const { userInfo } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();
  const [incomingRequest, setIncomingRequest] = React.useState<any>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (!userInfo) {
      router.replace("/login" as any);
    } else if (userInfo.userType !== 'priest') {
      // Force redirect to correct layout if role doesn't match
      router.replace("/devotee/HomeTab" as any);
    }
  }, [userInfo]);

  if (!userInfo) return null;

  React.useEffect(() => {
    if (socket) {
      socket.on("new_instant_request", (data) => {
        console.log("New instant request received:", data);
        setIncomingRequest(data);
        setModalVisible(true);
      });

      return () => {
        socket.off("new_instant_request");
      };
    }
  }, [socket]);

  const handleAccept = async (bookingId: string) => {
    try {
      await priestService.acceptInstantBooking(bookingId);
      setModalVisible(false);
      setIncomingRequest(null);
      
      // Navigate to booking details
      router.push({
        pathname: "/priest/PujaRequestDetails",
        params: { bookingId }
      });
      
      Alert.alert("Success", "Instant booking confirmed!");
    } catch (error: any) {
      console.error("Failed to accept instant booking:", error);
      Alert.alert("Failed", error.message || "Could not accept booking. It might have expired or been taken.");
      setModalVisible(false);
      setIncomingRequest(null);
    }
  };

  const handleDecline = () => {
    setModalVisible(false);
    setIncomingRequest(null);
  };

  return (
    <NotificationProvider>
      <PriestTabs />
      <NotificationOverlay />
      <IncomingRequestModal
        visible={modalVisible}
        request={incomingRequest}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onClose={handleDecline}
      />
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_COLORS.error,
    borderWidth: 1,
    borderColor: APP_COLORS.white,
  },
  floatingNotificationContainer: {
    position: 'absolute',
    right: 16,
    // Top is set dynamically
    zIndex: 2000, // Higher than everything
    width: '55%',
    maxHeight: '55%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    alignItems: 'flex-end',
  },
  notificationArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: APP_COLORS.white,
    marginRight: 10,
  },
  notificationCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    maxHeight: '100%',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: APP_COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
    paddingBottom: 4,
  },
  notificationList: {
    maxHeight: 250,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: APP_COLORS.lightGray,
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff',
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.primary,
    marginRight: 8,
    marginTop: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: APP_COLORS.black,
    flex: 1,
    lineHeight: 18,
  },
  noNotificationsText: {
    textAlign: 'center',
    color: APP_COLORS.gray,
    fontSize: 13,
    padding: 10,
  },
});
