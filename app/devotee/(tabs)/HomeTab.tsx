import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";
import { useNotifications } from "../../../context/NotificationContext";
import { Alert } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock Data (renders immediately, no backend dependency) ───────────────
const MOCK_PANCHANG = {
  title: "Today is Ekadashi",
  subtitle: "Auspicious for Vishnu Puja & Fasting",
  nakshatra: "Rohini",
  tithi: "Ekadashi",
};

const MOCK_BANNERS = [
  { id: "1", title: "Ganesh Chaturthi Special", subtitle: "10% Off on all Ganesh Pujas", color: "#FF9933" },
  { id: "2", title: "Navratri Celebrations", subtitle: "Book Durga Puja early", color: "#C62828" },
  { id: "3", title: "New Priest Onboarded", subtitle: "Pandit Sharma now available", color: "#2E7D32" },
];

const MOCK_BOOK_AGAIN = [
  { id: "1", name: "Satyanarayan Puja", priest: "Pandit Sharma", date: "Jan 15, 2026", price: "₹2,100" },
  { id: "2", name: "Griha Pravesh", priest: "Pandit Verma", date: "Dec 20, 2025", price: "₹5,500" },
];

const CATEGORY_DATA = [
  { id: "1", name: "Havans", icon: "flame-outline" as const, color: "#FF6B35" },
  { id: "2", name: "Festivals", icon: "sparkles-outline" as const, color: "#E91E63" },
  { id: "3", name: "Pujas", icon: "flower-outline" as const, color: "#FF9933" },
  { id: "4", name: "Ancestors", icon: "people-outline" as const, color: "#7B1FA2" },
];

// ─── Component ────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();

  // Fetch ceremonies from backend
  const { data: ceremoniesData, isLoading: isLoadingCeremonies } = useQuery({
    queryKey: ["ceremonies", "popular"],
    queryFn: () => ceremonyService.getAllPujas({ limit: 5 }),
    select: (data) => data.ceremonies || [],
  });

  // Fetch recommended priests & pending actions
  const [recommendedPriests, setRecommendedPriests] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priestsRes, actionsRes] = await Promise.allSettled([
          devoteeService.searchPriests({ limit: 10 }),
          devoteeService.getPendingActions(),
        ]);

        if (priestsRes.status === "fulfilled" && priestsRes.value?.priests?.length > 0) {
          setRecommendedPriests(priestsRes.value.priests);
        } else {
          setRecommendedPriests([]);
        }

        if (actionsRes.status === "fulfilled") {
          setPendingActions(actionsRes.value);
        }
      } catch (err) {
        // Fail silently — mock data ensures UI still renders
      }
    };
    fetchData();
  }, []);

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

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.background }}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Namaste, {firstName} 🙏</Text>
            <Text style={styles.headerSubtitle}>What would you like to do today?</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.locationPill}>
              <Ionicons name="location" size={14} color={APP_COLORS.saffron} />
              <Text style={styles.locationText}>Hyderabad</Text>
            </TouchableOpacity>
            <NotificationBellInline />
          </View>
        </View>

        {/* ── Panchang Widget ────────────────────────────────── */}
        <View style={styles.sectionPadding}>
          <Card style={styles.panchangCard}>
            <View style={styles.panchangGradient}>
              <View style={styles.panchangIconWrap}>
                <Ionicons name="sunny" size={28} color="#FFA726" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.panchangTitle}>{MOCK_PANCHANG.title}</Text>
                <Text style={styles.panchangSub}>{MOCK_PANCHANG.subtitle}</Text>
                <View style={styles.panchangTags}>
                  <View style={styles.panchangTag}>
                    <Text style={styles.panchangTagText}>Nakshatra: {MOCK_PANCHANG.nakshatra}</Text>
                  </View>
                  <View style={styles.panchangTag}>
                    <Text style={styles.panchangTagText}>Tithi: {MOCK_PANCHANG.tithi}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </View>

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
            {MOCK_BANNERS.map((banner) => (
              <TouchableOpacity
                key={banner.id}
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
            {MOCK_BANNERS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, activeBanner === i && styles.dotActive]}
              />
            ))}
          </View>
        </View>

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

        {/* ── Book Again ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔁 Book Again</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {MOCK_BOOK_AGAIN.map((item) => (
              <Card key={item.id} style={styles.bookAgainCard} onPress={() => { }}>
                <View style={styles.bookAgainIcon}>
                  <Ionicons name="flame" size={24} color={APP_COLORS.saffron} />
                </View>
                <Text style={styles.bookAgainName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.bookAgainPriest}>{item.priest}</Text>
                <Text style={styles.bookAgainDate}>{item.date}</Text>
                <PrimaryButton title="Repeat" onPress={() => { }} size="sm" variant="outline" style={{ marginTop: 8 }} />
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* ── Shop by Category ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕉️ Book by Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_DATA.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() => router.push("/(devoteeScreens)/(pujas)/AllPujas")}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + "18" }]}>
                  <Ionicons name={cat.icon} size={32} color={cat.color} />
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
          {isLoadingCeremonies ? (
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
                <View style={styles.viewAllBox}>
                  <Ionicons name="arrow-forward-circle" size={32} color={APP_COLORS.saffron} />
                  <Text style={styles.viewAllCardText}>View All</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          )}
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
});

export default HomeScreen;
