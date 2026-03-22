import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { APP_COLORS } from "../../../constants/Colors";
import { RootState } from "../../../redux/store";
import devoteeService from "../../../services/devoteeService";
import ceremonyService from "../../../services/ceremonyService";
import { getImageUri } from "../../../utils/imageUtils";
import RatingModal from "../../../components/RatingModal";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";
import { useNotifications } from "../../../context/NotificationContext";
import PujariCard from "../../../components/PujariCard";
import { calculateDistance } from "../../../utils/locationUtils";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(WINDOW_WIDTH, 600) : WINDOW_WIDTH;

// No mock data needed - using 3-state UI


// ─── Component ────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Fetch ceremonies from backend
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [recommendedPriests, setRecommendedPriests] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCity, setCurrentCity] = useState("Hyderabad");
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Dynamic Metadata State
  const [panchang, setPanchang] = useState<any>(null);
  const [ceremoniesData, setCeremoniesData] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchData = async (coords?: { latitude: number, longitude: number }) => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const [priestsRes, actionsRes, addressRes, recentRes, bannersRes, panchangRes, categoriesRes, ceremoniesRes] = await Promise.allSettled([
        devoteeService.searchPriests({ limit: 10 }),
        devoteeService.getPendingActions(),
        devoteeService.getAddresses(),
        devoteeService.getBookings('completed'),
        devoteeService.getBanners(),
        devoteeService.getPanchang(),
        devoteeService.getCategories(),
        ceremonyService.getAllPujas({ limit: 5 })
      ]);

      // Check if primary data fetching failed (categories and ceremonies are essential)
      if (categoriesRes.status === "rejected" || ceremoniesRes.status === "rejected") {
        setIsError(true);
        return;
      }

      if (priestsRes.status === "fulfilled" && priestsRes.value?.priests?.length > 0) {
        let priests = priestsRes.value.priests;
        const effectiveCoords = coords || userCoords;
        
        if (effectiveCoords) {
          priests = priests.map((p: any) => {
            if (p.location?.coordinates) {
              const distance = calculateDistance(
                effectiveCoords.latitude,
                effectiveCoords.longitude,
                p.location.coordinates[1],
                p.location.coordinates[0]
              );
              return { ...p, distance };
            }
            return p;
          });
        }
        setRecommendedPriests(priests);
      }

      if (actionsRes.status === "fulfilled") {
        setPendingActions(actionsRes.value);
      }

      if (addressRes.status === "fulfilled" && Array.isArray(addressRes.value)) {
        const defaultAddr = addressRes.value.find(a => a.isDefault) || addressRes.value[0];
        if (defaultAddr?.city) {
          setCurrentCity(defaultAddr.city);
        }
      }

      if (recentRes.status === "fulfilled") {
        const bookings = Array.isArray(recentRes.value) ? recentRes.value : recentRes.value?.data || [];
        
        // Deduplicate by ceremonyType
        const uniqueBookings: any[] = [];
        const seenCeremonies = new Set();
        
        for (const booking of bookings) {
          if (!seenCeremonies.has(booking.ceremonyType)) {
            seenCeremonies.add(booking.ceremonyType);
            uniqueBookings.push(booking);
          }
        }
        
        setRecentBookings(uniqueBookings.slice(0, 5));
      }

      if (bannersRes.status === "fulfilled" && bannersRes.value?.length > 0) {
        setBanners(bannersRes.value);
      }

      if (panchangRes.status === "fulfilled" && panchangRes.value) {
        setPanchang(panchangRes.value);
      }

      if (categoriesRes.status === "fulfilled" && categoriesRes.value?.length > 0) {
        setCategories(categoriesRes.value);
      }

      if (ceremoniesRes.status === "fulfilled") {
        setCeremoniesData(ceremoniesRes.value.ceremonies || []);
      }
    } catch (err) {
      console.error("Home feed error:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const requests = await devoteeService.getMyRequests();
      setMyRequests(Array.isArray(requests) ? requests.slice(0, 5) : []);
    } catch (err) {
      console.error("Load requests error:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchData(userCoords || undefined),
      loadRequests(),
    ]);
    setRefreshing(false);
  }, [userCoords]);

  useEffect(() => {
    const initLocationAndFetch = async () => {
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserCoords(coords);
        }
      } catch (err) {
        console.warn("Failed to get location:", err);
      } finally {
        fetchData(coords);
      }
    };

    initLocationAndFetch();
  }, []);

  // Refresh booking requests whenever tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );


  const openRateModal = (booking: any) => {
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
        role: "devotee_to_priest",
      });
      Alert.alert("Success", "Review submitted!");
      setPendingActions((prev) => prev.filter((a) => a.booking._id !== selectedBookingForRating._id));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setRateModalVisible(false);
      setSelectedBookingForRating(null);
    }
  };

  const handleCeremonyPress = (ceremony: { _id: string; name: string }) => {
    router.push(`/(devoteeScreens)/(pujas)/${ceremony._id}`);
  };

  const handleRepeatBooking = (booking: any) => {
    if (booking.priestId?._id) {
      router.push(`/(devoteeScreens)/(priest)/PriestDetails?priestId=${booking.priestId._id}`);
    }
  };

  const firstName = userInfo?.name?.split(" ")[0] || "Devotee";

  // Inline notification bell using the global NotificationContext
  const NotificationBellInline = () => {
    const { unreadCount, toggleNotifications, showNotifications } = useNotifications();
    return (
      <TouchableOpacity style={styles.bellButton} onPress={toggleNotifications}>
        <Ionicons
          name={showNotifications ? "notifications" : "notifications-outline"}
          size={22}
          color={APP_COLORS.bodyText}
        />
        {unreadCount > 0 && <View style={styles.notifDot} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: APP_COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner text="Fetching your spiritual home..." />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: APP_COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ErrorMessage 
          message="We couldn't load the home feed. Please check your connection."
          showRetry
          onRetry={() => fetchData(userCoords || undefined)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.saffron} />
        }
      >
        <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Namaste, {firstName} 🙏</Text>
              <Text style={styles.headerSubtitle}>What would you like to do today?</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.locationPill} onPress={() => router.push('/(devoteeScreens)/profile/ManageAddresses')}>
                <Ionicons name="location" size={14} color={APP_COLORS.saffron} />
                <Text style={styles.locationText}>{currentCity}</Text>
              </TouchableOpacity>
              <NotificationBellInline />
            </View>
          </View>

          {/* ── Panchang Widget ────────────────────────────────── */}
          {panchang && (
            <View style={styles.sectionPadding}>
              <Card style={styles.panchangCard}>
                <View style={styles.panchangGradient}>
                  <View style={styles.panchangIconWrap}>
                    <Ionicons name="sunny" size={28} color="#FFA726" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.panchangTitle}>{panchang.title}</Text>
                    <Text style={styles.panchangSub}>{panchang.subtitle}</Text>
                    <View style={styles.panchangTags}>
                      <View style={styles.panchangTag}>
                        <Text style={styles.panchangTagText}>Nakshatra: {panchang.nakshatra}</Text>
                      </View>
                      <View style={styles.panchangTag}>
                        <Text style={styles.panchangTagText}>Tithi: {panchang.tithi}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* ── Hero Carousel ──────────────────────────────────── */}
          <View style={styles.sectionPadding}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const page = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                setActiveBanner(page);
              }}
            >
              {banners.map((banner) => (
                <TouchableOpacity
                  key={banner._id || banner._id}
                  style={[styles.bannerCard, { backgroundColor: banner.color }]}
                  activeOpacity={0.9}
                >
                  <Ionicons name="megaphone" size={32} color="rgba(255,255,255,0.3)" style={styles.bannerIcon} />
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.dotsRow}>
              {banners.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, activeBanner === i && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {/* ── Recommended Priests ───────────────────────────── */}
          {recommendedPriests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🙏 Recommended Priests</Text>
                <TouchableOpacity onPress={() => router.push('/(devoteeScreens)/(priest)/PriestSearch')}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {recommendedPriests.map((priest) => (
                  <View key={priest._id} style={{ width: 280, marginRight: 12 }}>
                    <PujariCard pujari={priest} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── My Requests ────────────────────────────────────── */}
          {myRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📋 My Requests</Text>
                <TouchableOpacity onPress={() => router.push('/devotee/(tabs)/BookingsTab')}>
                  <Text style={styles.viewAllLink}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {myRequests.map((req: any, idx: number) => {
                  const statusColor =
                    req.status === 'confirmed' ? '#2E7D32' :
                      req.status === 'cancelled' || req.status === 'cancelled_by_devotee' ? '#C62828' :
                        req.status === 'arrived' || req.status === 'in_progress' ? APP_COLORS.primary :
                          '#E65100';
                  const statusBg =
                    req.status === 'confirmed' ? '#E8F5E9' :
                      req.status === 'cancelled' || req.status === 'cancelled_by_devotee' ? '#FFEBEE' :
                        req.status === 'arrived' || req.status === 'in_progress' ? APP_COLORS.primary + '10' :
                          '#FFF3E0';
                  const statusIcon =
                    req.status === 'confirmed' ? 'checkmark-circle' :
                      req.status === 'cancelled' || req.status === 'cancelled_by_devotee' ? 'close-circle' :
                        req.status === 'arrived' ? 'location' :
                          req.status === 'in_progress' ? 'play-circle' :
                            'hourglass-outline';
                  const statusLabel =
                    req.status === 'confirmed' ? 'Confirmed' :
                      req.status === 'cancelled' || req.status === 'cancelled_by_devotee' ? 'Declined' :
                        req.status === 'arrived' ? 'Arrived' :
                          req.status === 'in_progress' ? 'Ongoing' :
                            'Pending';
                  const priestName = req.priestId?.name || 'Priest';
                  return (
                    <View key={req._id || idx} style={[styles.reqCard, { borderLeftColor: statusColor }]}>
                      <View style={[styles.reqStatusBadge, { backgroundColor: statusBg }]}>
                        <Ionicons name={statusIcon as any} size={13} color={statusColor} />
                        <Text style={[styles.reqStatusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                      <Text style={styles.reqCeremony} numberOfLines={1}>{req.ceremonyType || 'Ceremony'}</Text>
                      <Text style={styles.reqPriestName} numberOfLines={1}>{priestName}</Text>
                      <Text style={styles.reqDate}>{new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Pending Actions ────────────────────────────────── */}
          {pendingActions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Pending Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {pendingActions.map((action, index) => (
                  <Card key={index} style={styles.actionCard}>
                    <View style={styles.actionRow}>
                      <View style={styles.actionIconWrap}>
                        <Ionicons name="star-outline" size={22} color={APP_COLORS.warning} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionDesc} numberOfLines={1}>{action.description}</Text>
                      </View>
                    </View>
                    <PrimaryButton title="Rate Experience" onPress={() => openRateModal(action)} size="sm" />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}

          {recentBookings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔁 Book Again</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {recentBookings.map((item) => (
                  <Card key={item._id} style={styles.bookAgainCard} onPress={() => handleRepeatBooking(item)}>
                    <View style={styles.bookAgainIcon}>
                      <Ionicons name="flame" size={24} color={APP_COLORS.saffron} />
                    </View>
                    <Text style={styles.bookAgainName} numberOfLines={1}>{item.ceremonyType}</Text>
                    <Text style={styles.bookAgainPriest}>{item.priestId?.name}</Text>
                    <Text style={styles.bookAgainDate}>
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                    <PrimaryButton title="Repeat" onPress={() => handleRepeatBooking(item)} size="sm" variant="outline" style={{ marginTop: 8 }} />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Shop by Category ───────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕉️ Book by Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id || (cat as any)?.slug || (cat as any)?.id}
                  style={styles.categoryCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: "/devotee/(tabs)/ExploreTab",
                    params: { category: cat.slug }
                  })}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: (cat.color || APP_COLORS.saffron) + "18" }]}>
                    <Ionicons name={cat.icon as any} size={32} color={cat.color || APP_COLORS.saffron} />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Popular Ceremonies (from API) ───────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌟 Popular Ceremonies</Text>
              <TouchableOpacity onPress={() => router.push("/(devoteeScreens)/(pujas)/AllPujas")}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={APP_COLORS.saffron} style={{ marginTop: 16 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {ceremoniesData?.map((ceremony: any) => (
                  <TouchableOpacity
                    key={ceremony._id}
                    style={styles.ceremonyCard}
                    onPress={() => handleCeremonyPress(ceremony)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ 
                        uri: getImageUri(ceremony.image || ceremony.images?.[0]) 
                      }}
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
                  <View style={styles.viewAllBox}>
                    <Ionicons name="arrow-forward-circle" size={32} color={APP_COLORS.saffron} />
                    <Text style={styles.viewAllCardText}>View All</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>

      <RatingModal
        isVisible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
        onSubmit={handleSubmitRating}
        role="devotee"
        bookingDetails={
          selectedBookingForRating
            ? {
              ceremonyType: selectedBookingForRating.ceremonyType,
              date: selectedBookingForRating.date,
              clientName: selectedBookingForRating.priestName,
            }
            : undefined
        }
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },

  // Header
  header: {
    backgroundColor: APP_COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: APP_COLORS.headingText,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.saffronLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "600",
    color: APP_COLORS.saffron,
  },
  bellButton: {
    position: "relative",
    padding: 4,
  },
  notifDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.error,
  },

  // Panchang
  panchangCard: {
    backgroundColor: "#FFF8F0",
    borderLeftWidth: 4,
    borderLeftColor: APP_COLORS.saffron,
  },
  panchangGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  panchangIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  panchangTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.headingText,
    marginBottom: 2,
  },
  panchangSub: {
    fontSize: 13,
    color: APP_COLORS.bodyText,
    marginBottom: 8,
  },
  panchangTags: {
    flexDirection: "row",
    gap: 8,
  },
  panchangTag: {
    backgroundColor: APP_COLORS.saffron + "15",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  panchangTagText: {
    fontSize: 11,
    color: APP_COLORS.saffron,
    fontWeight: "600",
  },

  // Banner Carousel
  bannerCard: {
    width: SCREEN_WIDTH - 32,
    height: 140,
    borderRadius: 16,
    padding: 20,
    justifyContent: "flex-end",
    marginRight: 0,
    overflow: "hidden",
  },
  bannerIcon: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_COLORS.lightGray,
  },
  dotActive: {
    width: 20,
    backgroundColor: APP_COLORS.saffron,
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionPadding: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: APP_COLORS.headingText,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: "600",
    color: APP_COLORS.saffron,
  },

  // Pending Actions
  actionCard: {
    width: 260,
    marginRight: 12,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.warning,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.warning + "18",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: APP_COLORS.black,
  },
  actionDesc: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 2,
  },

  // Book Again
  bookAgainCard: {
    width: 170,
    marginRight: 12,
    alignItems: "center",
  },
  bookAgainIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: APP_COLORS.saffronLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  bookAgainName: {
    fontSize: 14,
    fontWeight: "700",
    color: APP_COLORS.headingText,
    textAlign: "center",
  },
  bookAgainPriest: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 2,
  },
  bookAgainDate: {
    fontSize: 11,
    color: APP_COLORS.gray,
    marginTop: 2,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    color: APP_COLORS.headingText,
  },

  // Ceremonies
  ceremonyCard: {
    width: 150,
    height: 190,
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
  },
  ceremonyImage: {
    width: "100%",
    height: "100%",
  },
  ceremonyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
  },
  ceremonyName: {
    position: "absolute",
    bottom: 14,
    left: 12,
    right: 12,
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  viewAllCard: {
    backgroundColor: APP_COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: APP_COLORS.lightGray,
    borderStyle: "dashed",
  },
  viewAllBox: {
    alignItems: "center",
    gap: 6,
  },
  viewAllCardText: {
    color: APP_COLORS.saffron,
    fontWeight: "700",
    fontSize: 14,
  },

  // My Requests
  reqCard: {
    width: 160,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  reqStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  reqStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  reqCeremony: {
    fontSize: 14,
    fontWeight: "700",
    color: APP_COLORS.headingText,
    marginBottom: 4,
  },
  reqPriestName: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 2,
  },
  reqDate: {
    fontSize: 11,
    color: APP_COLORS.gray,
  },
});

export default HomeScreen;
