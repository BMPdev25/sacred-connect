import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from 'react-redux';
import { APP_COLORS } from "../../../constants/Colors";
import { AppDispatch, RootState } from '../../../redux/store';
import PriestService from "../../../services/priestService";

const BookingsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        // console.log("Fetching bookings for priest:", userInfo?._id, "with filter:", selectedFilter);
        const data = await PriestService.getBookings(userInfo?._id, selectedFilter);
        // console.log("Fetched bookings (raw):", data);
        // normalize response to an array
        const arr = Array.isArray(data) ? data : data?.data || data?.bookings || [];
        setBookings(arr);
      } catch (err: any) {
        setError(err?.toString?.() || err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    // only fetch when we have a priest id
    if (userInfo?._id) fetchBookings();
  }, [selectedFilter, userInfo?._id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  const renderBookingItem = ({ item }: { item: any }) => {
    const bookingDate = new Date(item.date);
    const formattedDate = bookingDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push("/PriestBookingDetails")}
      >
        <View>
          <View style={styles.bookingHeader}>
            <Text style={styles.ceremonyType}>{item.ceremonyType}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "confirmed"
                      ? "#e6f7e6"
                      : item.status === "completed"
                      ? "#e6f0ff"
                      : item.status === "cancelled"
                      ? "#ffe6e6"
                      : "#fff9e6",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "confirmed"
                        ? APP_COLORS.success
                        : item.status === "completed"
                        ? APP_COLORS.info
                        : item.status === "cancelled"
                        ? APP_COLORS.error
                        : APP_COLORS.warning,
                  },
                ]}
              >
                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.devoteeId?.name || "Unknown Client"}</Text>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={APP_COLORS.gray} />
              <Text style={styles.detailText}>{formattedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={APP_COLORS.gray} />
              <Text style={styles.detailText}>{item.startTime || "N/A"} - {item.endTime || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={APP_COLORS.gray} />
              <Text style={styles.detailText} numberOfLines={1}>{item.location?.address || "-"}</Text>
            </View>
          </View>

          <View style={styles.bookingFooter}>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount:</Text>
              <Text style={styles.amountValue}>₹{item.basePrice ?? 0}</Text>
            </View>
            <View style={styles.actionsContainer}>
              {item.status === "pending" && (
                <>
                  <TouchableOpacity style={styles.acceptButton}>
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton}>
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === "confirmed" && (
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <View style={{ flex: 1 }}>
        <View
          style={[
            styles.header,
            {
              paddingTop: 24,
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
          <Text style={styles.headerTitle}>Bookings</Text>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "today" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("today")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "today" && styles.activeFilterText,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "upcoming" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("upcoming")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "upcoming" && styles.activeFilterText,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "pending" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("pending")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "pending" && styles.activeFilterText,
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === "completed" && styles.activeFilterButton,
              ]}
              onPress={() => setSelectedFilter("completed")}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === "completed" && styles.activeFilterText,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={[styles.listContainer, { flexGrow: 1 }]}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Text style={{ color: APP_COLORS.gray }}>No bookings available</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
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
  filterContainer: {
    backgroundColor: APP_COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  activeFilterButton: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  filterText: {
    color: APP_COLORS.gray,
  },
  activeFilterText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ceremonyType: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  clientInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
    paddingTop: 12,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionsContainer: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: APP_COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  declineButton: {
    backgroundColor: APP_COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  declineButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  viewButton: {
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
    color: APP_COLORS.primary,
    fontWeight: "bold",
  },
});

export default BookingsScreen;
