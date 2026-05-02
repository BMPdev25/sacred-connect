import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Location from 'expo-location';
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
import { useQueryClient } from "@tanstack/react-query";
import { APP_COLORS } from "../../../constants/Colors";
import { RootState } from "../../../redux/store";
import devoteeService from "../../../services/devoteeService";
import ceremonyService from "../../../services/ceremonyService";
import { getImageUri } from "../../../utils/imageUtils";
import RatingModal from "../../../components/RatingModal";
import PrimaryButton from "../../../components/PrimaryButton";
import { useNotifications } from "../../../context/NotificationContext";
import { calculateDistance } from "../../../utils/locationUtils";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { LinearGradient } from "expo-linear-gradient";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(WINDOW_WIDTH, 600) : WINDOW_WIDTH;

const HomeScreen: React.FC = () => {
  const { userInfo } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [recommendedPriests, setRecommendedPriests] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCity, setCurrentCity] = useState("Varanasi, India");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Dynamic Metadata State
  const [banners, setBanners] = useState<any[]>([]);

  const fetchData = async (coords?: { latitude: number, longitude: number }) => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const [priestsRes, actionsRes, addressRes, bannersRes] = await Promise.allSettled([
        devoteeService.searchPriests({ limit: 10 }),
        devoteeService.getPendingActions(),
        devoteeService.getAddresses(),
        devoteeService.getBanners()
      ]);

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
          setCurrentCity(defaultAddr.city + ", India");
        }
      }

      if (bannersRes.status === "fulfilled" && bannersRes.value?.length > 0) {
        setBanners(bannersRes.value);
      }

    } catch (err) {
      console.error("Home feed error:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(userCoords || undefined);
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

  const NotificationBellInline = () => {
    const { unreadCount, toggleNotifications, showNotifications } = useNotifications();
    return (
      <TouchableOpacity style={styles.bellButton} onPress={toggleNotifications}>
        <Ionicons
          name="notifications"
          size={24}
          color={APP_COLORS.maroon}
        />
        {unreadCount > 0 && <View style={styles.notifDot} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: APP_COLORS.neutral, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner text="Fetching your spiritual home..." />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: APP_COLORS.neutral, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ErrorMessage 
          message="We couldn't load the home feed. Please check your connection."
          showRetry
          onRetry={() => fetchData(userCoords || undefined)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: APP_COLORS.neutral }}>
      <StatusBar style="dark" backgroundColor={APP_COLORS.neutral} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.saffron} />
        }
      >
        <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerLeft}>
                {(userInfo as any)?.profilePic ? (
                  <Image
                    source={{ uri: getImageUri((userInfo as any).profilePic) }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarFallback]}>
                    <Ionicons name="person" size={20} color="#FFF" />
                  </View>
                )}
                <View style={styles.headerLocationWrap}>
                    <Text style={styles.locationLabel}>LOCATION</Text>
                    <Text style={styles.locationText}>{currentCity}</Text>
                </View>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.appTitle}>BookMyPujari</Text>
            </View>
            <View style={styles.headerRight}>
              <NotificationBellInline />
            </View>
          </View>

          {/* ── Upcoming Festivals ──────────────────────────────────── */}
          <View style={styles.sectionPadding}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Festivals</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAllText}>VIEW ALL</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
                {/* Dummy banner based on image */}
                <View style={styles.bannerWrapper}>
                    <LinearGradient
                        colors={['#CC3B00', '#7E2000']}
                        style={styles.bannerCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* We add a glassy overlay here */}
                        <View style={styles.glassyOverlay}>
                            <Text style={styles.bannerTitle}>Grand Diwali Puja</Text>
                            <Text style={styles.bannerSubtitle}>Invoke prosperity and light with our expert Mahatmas</Text>
                            
                            <View style={styles.bannerBottomRow}>
                                <View style={styles.datePill}>
                                    <Text style={styles.datePillText}>Nov 12</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.bannerArrow}/>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Second partially visible banner */}
                <View style={styles.bannerWrapper}>
                    <LinearGradient
                        colors={['#7E2000', '#541500']}
                        style={styles.bannerCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                    </LinearGradient>
                </View>
            </ScrollView>
          </View>

          {/* ── Sacred Services ───────────────────────────────── */}
          <View style={styles.sectionPadding}>
             <Text style={styles.sectionTitle}>Sacred Services</Text>
            <View style={styles.serviceGrid}>
                {/* Pujas */}
                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push("/devotee/(tabs)/ExploreTab")}>
                    <View style={styles.serviceIconWrap}>
                        <Ionicons name="home" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.serviceTitle}>Pujas</Text>
                    <Text style={styles.serviceSubtitle}>50+ OPTIONS</Text>
                </TouchableOpacity>

                {/* Astrology */}
                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push("/devotee/(tabs)/ExploreTab")}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="sparkles" size={28} color={APP_COLORS.tertiary} />
                    </View>
                    <Text style={styles.serviceTitle}>Astrology</Text>
                    <Text style={styles.serviceSubtitle}>EXPERT ADVICE</Text>
                </TouchableOpacity>

                {/* Havan */}
                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push("/devotee/(tabs)/ExploreTab")}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="flame" size={28} color={APP_COLORS.tertiary} />
                    </View>
                    <Text style={styles.serviceTitle}>Havan</Text>
                    <Text style={styles.serviceSubtitle}>RITUAL FIRE</Text>
                </TouchableOpacity>

                {/* Vastu */}
                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push("/devotee/(tabs)/ExploreTab")}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="home" size={28} color={APP_COLORS.tertiary} />
                    </View>
                    <Text style={styles.serviceTitle}>Vastu</Text>
                    <Text style={styles.serviceSubtitle}>HOME HARMONY</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* ── Top Rated Pandits ───────────────────────────── */}
          <View style={styles.sectionPadding}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Rated Pandits</Text>
                <TouchableOpacity onPress={() => router.push('/(devoteeScreens)/(priest)/PriestSearch')}>
                  <Text style={styles.viewAllText}>NEARBY</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                  {/* Mocked Pandit card 1 based on Image */}
                  <View style={styles.panditCard}>
                     <View style={styles.panditImageWrap}>
                        <Image source={require('../../../assets/images/icon.png')} style={styles.panditImage} />
                        <View style={styles.availableTag}>
                            <View style={styles.greenDot} />
                            <Text style={styles.availableText}>AVAILABLE</Text>
                        </View>
                     </View>

                     <View style={styles.panditInfo}>
                         <View style={styles.panditHeader}>
                             <Text style={styles.panditName}>Pandit{"\n"}Shanti{"\n"}Krishna</Text>
                             <View style={styles.ratingPill}>
                                 <Ionicons name="star" size={10} color="#D96321" />
                                 <Text style={styles.ratingText}>4.9</Text>
                             </View>
                         </View>
                         <Text style={styles.panditExp}>Rigveda{"\n"}Specialist • 24 yrs{"\n"}exp.</Text>

                         <View style={styles.tagsRow}>
                             <View style={styles.tagPill}><Text style={styles.tagText}>Mantra Chanting</Text></View>
                         </View>
                         <View style={styles.tagsRow}>
                             <View style={styles.tagPill}><Text style={styles.tagText}>Katha</Text></View>
                         </View>

                         <TouchableOpacity style={styles.bookNowBtn}>
                            <Text style={styles.bookNowText}>BOOK NOW</Text>
                         </TouchableOpacity>
                     </View>
                  </View>

                  {/* Mocked Pandit card 2 */}
                  <View style={styles.panditCard}>
                     <View style={styles.panditImageWrap}>
                        <Image source={require('../../../assets/images/icon.png')} style={styles.panditImage} />
                        <View style={styles.availableTag}>
                            <View style={styles.greenDot} />
                            <Text style={styles.availableText}>AVAILABLE</Text>
                        </View>
                     </View>

                     <View style={styles.panditInfo}>
                         <View style={styles.panditHeader}>
                             <Text style={styles.panditName}>Acharya{"\n"}Meera{"\n"}Devi</Text>
                             <View style={styles.ratingPill}>
                                 <Ionicons name="star" size={10} color="#D96321" />
                                 <Text style={styles.ratingText}>4.8</Text>
                             </View>
                         </View>
                         <Text style={styles.panditExp}>Vedic Astrology •{"\n"}18 yrs exp.</Text>

                         <View style={styles.tagsRow}>
                             <View style={styles.tagPill}><Text style={styles.tagText}>Kundali</Text></View>
                             <View style={styles.tagPill}><Text style={styles.tagText}>Vastu</Text></View>
                         </View>

                         <TouchableOpacity style={styles.bookNowBtn}>
                            <Text style={styles.bookNowText}>BOOK NOW</Text>
                         </TouchableOpacity>
                     </View>
                  </View>
              </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat FAB */}
      <TouchableOpacity style={styles.fab}>
          <Ionicons name="chatbubble" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.neutral,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: APP_COLORS.neutral,
  },
  headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  avatarImg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#DDD',
  },
  avatarFallback: {
      backgroundColor: APP_COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
  },
  headerLocationWrap: {
      justifyContent: 'center',
  },
  locationLabel: {
      fontSize: 10,
      color: APP_COLORS.gray,
      letterSpacing: 0.5,
      fontWeight: '600'
  },
  locationText: {
      fontSize: 13,
      fontWeight: "700",
      color: APP_COLORS.tertiary,
  },
  headerCenter: {
      flex: 1,
      alignItems: 'center',
  },
  appTitle: {
      fontSize: 20,
      fontFamily: 'serif',
      fontWeight: 'bold',
      color: APP_COLORS.tertiary,
  },
  headerRight: {
    alignItems: "flex-end",
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

  // Sections
  sectionPadding: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'serif',
    fontWeight: "700",
    color: APP_COLORS.tertiary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: '#A0522D',
  },

  // Banners
  bannerWrapper: {
      width: SCREEN_WIDTH - 60,
      marginRight: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
  },
  bannerCard: {
    width: "100%",
    height: 200,
    borderRadius: 24,
    padding: 16,
    justifyContent: "center",
    overflow: "hidden",
  },
  glassyOverlay: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
      padding: 16,
      width: '85%',
  },
  bannerTitle: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'serif',
      marginBottom: 8,
  },
  bannerSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 12,
      marginBottom: 16,
      lineHeight: 18,
  },
  bannerBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  datePill: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
  },
  datePillText: {
      color: '#D96321',
      fontWeight: 'bold',
      fontSize: 12,
  },
  bannerArrow: {
      padding: 8,
  },

  // Sacred Services Grid
  serviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
  },
  serviceBox: {
      width: '47%',
      backgroundColor: '#FAF8F5',
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#F0EBE1',
  },
  serviceIconWrap: {
      backgroundColor: '#D98934',
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
  },
  serviceIconWrapWhite: {
      backgroundColor: '#FFFFFF',
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  serviceTitle: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'serif',
      color: APP_COLORS.tertiary,
      marginBottom: 6,
  },
  serviceSubtitle: {
      fontSize: 10,
      fontWeight: '600',
      color: APP_COLORS.gray,
      letterSpacing: 0.5,
  },

  // Top Rated Pandits
  panditCard: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      width: 290,
      marginRight: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
  },
  panditImageWrap: {
      width: 110,
      height: '100%',
      position: 'relative',
  },
  panditImage: {
      width: '100%',
      height: '100%',
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 24,
      backgroundColor: '#EEE',
  },
  availableTag: {
      position: 'absolute',
      bottom: 12,
      alignSelf: 'center',
      backgroundColor: '#2E8B57',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
  },
  greenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFF',
  },
  availableText: {
      color: '#FFF',
      fontSize: 9,
      fontWeight: '700',
  },
  panditInfo: {
      flex: 1,
      padding: 16,
  },
  panditHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
  },
  panditName: {
      fontSize: 16,
      fontFamily: 'serif',
      fontWeight: 'bold',
      color: APP_COLORS.tertiary,
      lineHeight: 20,
  },
  ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF5E6',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
      gap: 2,
  },
  ratingText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#D96321',
  },
  panditExp: {
      fontSize: 11,
      color: APP_COLORS.gray,
      lineHeight: 16,
      marginBottom: 12,
  },
  tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 6,
  },
  tagPill: {
      backgroundColor: '#F3EFEA',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
  },
  tagText: {
      fontSize: 10,
      color: APP_COLORS.tertiary,
      fontWeight: '500',
  },
  bookNowBtn: {
      backgroundColor: '#D98934',
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
  },
  bookNowText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 12,
  },

  // FAB
  fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#D98934',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  }
});

export default HomeScreen;
