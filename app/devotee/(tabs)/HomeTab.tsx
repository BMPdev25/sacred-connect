import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { APP_COLORS } from "../../../constants/Colors";
import { RootState } from "../../../redux/store";
import devoteeService from "../../../services/devoteeService";
import ceremonyService from "../../../services/ceremonyService";
import RatingModal from "../../../components/RatingModal";
import { Alert } from "react-native";

const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const insets = useSafeAreaInsets();

  // Fetch ceremonies from backend
  const { data: ceremoniesData, isLoading: isLoadingCeremonies } = useQuery({
    queryKey: ["ceremonies", "popular"],
    queryFn: () => ceremonyService.getAllPujas({ limit: 5 }), // Using getAllPujas based on service wrapper
    select: (data) => data.ceremonies || [],
  });

  // Mock data for recommended priests
  const [recommendedPriests, setRecommendedPriests] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priestsRes, actionsRes] = await Promise.allSettled([
          devoteeService.searchPriests({ limit: 10 }),
          devoteeService.getPendingActions()
        ]);

        if (priestsRes.status === 'fulfilled' && priestsRes.value?.priests?.length > 0) {
          setRecommendedPriests(priestsRes.value.priests);
        } else {
          setRecommendedPriests([]);
        }

        if (actionsRes.status === 'fulfilled') {
          setPendingActions(actionsRes.value);
        }

      } catch (err) {
        console.error("Error fetching home data:", err);
      }
    };
    fetchData();
  }, []);

  const openRateModal = (booking: any) => {
    // Booking structure from getPendingActions might be slightly different
    // The structure returned from backend is: { ..., booking: { ... } }
    // We need to pass the inner booking object or construct what's needed
    setSelectedBookingForRating(booking.booking);
    setRateModalVisible(true);
  };

  const handleSubmitRating = async (rating: number, comment: string, tags: string[]) => {
    if (!selectedBookingForRating) return;

    try {
      await devoteeService.submitReview({
        bookingId: selectedBookingForRating._id,
        reviewerId: userInfo?._id,
        revieweeId: selectedBookingForRating.priestId,
        rating,
        comment,
        tags,
        role: 'devotee_to_priest'
      });

      Alert.alert("Success", "Review submitted!");
      // Remove from pending actions
      setPendingActions(prev => prev.filter(a => a.booking._id !== selectedBookingForRating._id));
    } catch (error: any) {
      console.error("Submit review error:", error);
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setRateModalVisible(false);
      setSelectedBookingForRating(null);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/(devoteeScreens)/GlobalSearch?query=${searchQuery}`);
  };

  const handleCeremonyPress = (ceremony: { _id: string; name: string }) => {
    router.push(`/(devoteeScreens)/(pujas)/${ceremony._id}`);
  };

  const handlePriestPress = (priest: any) => {
    router.push(`/PriestDetails?priestId=${priest._id}`);
    // navigation.navigate("PriestDetails", { priestId: priest._id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <StatusBar style="light" backgroundColor={APP_COLORS.primary} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 24) + 16,
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
          <View style={styles.headerContent}>
            <Text style={styles.welcomeText}>
              Welcome, {userInfo?.name || "Devotee"}
            </Text>
            <Text style={styles.headerTitle}>Find the Perfect Priest</Text>
            <Text style={styles.headerSubtitle}>
              Connect with experienced priests for your sacred ceremonies
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push("/(devoteeScreens)/GlobalSearch")}
            activeOpacity={1}
          >
            <Ionicons name="search" size={20} color={APP_COLORS.gray} />
            <Text style={[styles.searchInput, { color: APP_COLORS.gray, paddingTop: 4 }]}>
              Search for priests, ceremonies...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Pending Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {pendingActions.map((action, index) => (
                <View key={index} style={styles.actionCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.actionIcon, { backgroundColor: APP_COLORS.warning + '20' }]}>
                      <Ionicons name="star-outline" size={24} color={APP_COLORS.warning} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionDesc} numberOfLines={1}>{action.description}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: APP_COLORS.warning }]}
                    onPress={() => openRateModal(action)}
                  >
                    <Text style={styles.actionBtnText}>Rate Experience</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.ceremoniesContainer}>
          <Text style={styles.sectionTitle}>Popular Ceremonies</Text>
          {isLoadingCeremonies ? (
            <ActivityIndicator size="small" color={APP_COLORS.primary} style={{ marginLeft: 16, alignSelf: 'flex-start' }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ceremoniesScroll}
            >
              {ceremoniesData?.map((ceremony: any) => (
                <TouchableOpacity
                  key={ceremony._id}
                  style={styles.ceremonyCard}
                  onPress={() => handleCeremonyPress(ceremony)}
                >
                  <Image
                    source={{ uri: ceremony.image || ceremony.images?.[0]?.url || "https://via.placeholder.com/150" }}
                    style={styles.ceremonyImage}
                    resizeMode="cover"
                  />
                  <View style={styles.ceremonyOverlay} />
                  <Text style={styles.ceremonyName} numberOfLines={2}>{ceremony.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.ceremonyCard, styles.viewAllCard]}
                onPress={() => router.push("/(devoteeScreens)/(pujas)/AllPujas")}
              >
                <View style={styles.viewAllContent}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={APP_COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        <View style={styles.priestsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Priests</Text>
            <TouchableOpacity
              onPress={() => router.navigate("/PriestSearch")}
            >
              <Text style={styles.viewAllTextSmall}>View All</Text>
            </TouchableOpacity>
          </View>

          {recommendedPriests.map((priest) => (
            <TouchableOpacity
              key={priest._id}
              style={styles.priestCard}
              onPress={() => handlePriestPress(priest)}
            >
              <Image
                source={
                  priest.profilePicture
                    ? { uri: priest.profilePicture }
                    : require("../../../assets/images/pandit1.jpg")
                }
                style={styles.priestImage}
              />
              <View style={styles.priestInfo}>
                <Text style={styles.priestName}>{priest.name}</Text>
                <View style={styles.priestDetails}>
                  <Text style={styles.priestDetail}>
                    {priest.religiousTradition}
                  </Text>
                  <Text style={styles.priestDetail}>
                    {priest.experience} years exp
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {priest.ratings?.average || 0} ({priest.ratings?.count || 0}
                    )
                  </Text>
                </View>
                <View style={styles.specialtiesContainer}>
                  {priest.services
                    ?.slice(0, 2)
                    .map((service: any, index: number) => (
                      <View
                        key={`${priest._id}-ceremony-${index}-${service.name}`}
                        style={styles.specialtyBadge}
                      >
                        <Text style={styles.specialtyText}>{service.name}</Text>
                      </View>
                    ))}
                  {priest.services?.length > 2 && (
                    <View
                      key={`${priest._id}-more-ceremonies`}
                      style={styles.specialtyBadge}
                    >
                      <Text style={styles.specialtyText}>
                        +{priest.services.length - 2} more
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.bookNowContainer}>
                <TouchableOpacity
                  style={styles.bookNowButton}
                  onPress={() =>
                    router.navigate(`/BookCeremony?priestId=${priest._id}`)
                  }
                >
                  <Text style={styles.bookNowText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <RatingModal
        isVisible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
        onSubmit={handleSubmitRating}
        role="devotee"
        bookingDetails={selectedBookingForRating ? {
          ceremonyType: selectedBookingForRating.ceremonyType,
          date: selectedBookingForRating.date,
          clientName: selectedBookingForRating.priestName
        } : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  welcomeText: {
    color: APP_COLORS.white,
    opacity: 0.8,
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: APP_COLORS.white,
    opacity: 0.9,
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    padding: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  ceremoniesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ceremoniesScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  ceremonyCard: {
    width: 140,
    height: 180,
    borderRadius: 10,
    marginRight: 12,
    overflow: "hidden",
  },
  ceremonyImage: {
    width: "100%",
    height: "100%",
  },
  ceremonyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  ceremonyName: {
    position: "absolute",
    bottom: 16,
    left: 12,
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  viewAllCard: {
    backgroundColor: APP_COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    borderStyle: "dashed",
  },
  viewAllContent: {
    alignItems: "center",
  },
  viewAllText: {
    color: APP_COLORS.primary,
    fontWeight: "bold",
    marginBottom: 8,
  },
  priestsContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllTextSmall: {
    color: APP_COLORS.primary,
    fontSize: 14,
  },
  priestCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    flexDirection: "row",
    elevation: 2,
  },
  priestImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  priestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  priestName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  priestDetails: {
    flexDirection: "row",
    marginBottom: 4,
  },
  priestDetail: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: APP_COLORS.black,
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  specialtyBadge: {
    backgroundColor: APP_COLORS.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: APP_COLORS.primary,
  },
  bookNowContainer: {
    justifyContent: "center",
  },
  bookNowButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bookNowText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  upcomingBookingsContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  upcomingBookingCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  upcomingBookingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  upcomingBookingText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  sectionContainer: {
    marginBottom: 24,
  },
  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  actionCard: {
    backgroundColor: APP_COLORS.white,
    width: 260,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.warning
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.black,
    marginBottom: 2
  },
  actionDesc: {
    fontSize: 12,
    color: APP_COLORS.gray
  },
  actionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  actionBtnText: {
    color: APP_COLORS.white,
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default HomeScreen;
