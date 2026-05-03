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
  TextInput,
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
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCity, setCurrentCity] = useState("Varanasi, India");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Dynamic Metadata State
  const [banners, setBanners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (coords?: { latitude: number, longitude: number }) => {
    try {
      setIsLoading(true);
      setIsError(false);
      
      const [priestsRes, actionsRes, addressRes, bannersRes, festivalsRes, bookingsRes] = await Promise.allSettled([
        devoteeService.searchPriests({ limit: 10 }),
        devoteeService.getPendingActions(),
        devoteeService.getAddresses(),
        devoteeService.getBanners(),
        devoteeService.getFestivals(),
        devoteeService.getMyRequests()
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

      if (bookingsRes.status === "fulfilled") {
        setUpcomingBookings(bookingsRes.value);
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

      if (festivalsRes.status === "fulfilled" && festivalsRes.value?.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = festivalsRes.value
          .filter((f: any) => f.date >= today)
          .sort((a: any, b: any) => a.date.localeCompare(b.date));
        
        if (upcoming.length > 0) {
          setBanners(upcoming.map((f: any) => ({
            ...f,
            title: f.name || f.title,
            subtitle: f.description || f.subtitle || 'Experience the divine energy of this auspicious festival',
            isFestival: true
          })));
        }
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
    const { unreadCount, toggleNotifications } = useNotifications();
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
          <LinearGradient
            colors={['#FFFFFF', '#FDFBF7']}
            style={[styles.header, { paddingTop: insets.top + 16 }]}
          >
            <View>
              <Text style={styles.appTitle}>
                Book<Text style={{ color: APP_COLORS.primary }}>My</Text>Pujari
              </Text>
              <Text style={styles.greetingText}>Namasthe🙏, {userInfo?.name || 'Devotee'}</Text>
            </View>
            <View style={styles.headerRightWrap}>
              <NotificationBellInline />
            </View>
          </LinearGradient>

          {/* ── Search Bar ─────────────────────────────────────────── */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInner}>
              <Ionicons name="search" size={20} color={APP_COLORS.gray} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search for Pujas..."
                placeholderTextColor={APP_COLORS.gray}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    router.push({ pathname: "/devotee/(tabs)/ExploreTab", params: { search: searchQuery } });
                  }
                }}
              />
            </View>
          </View>

          {/* ── Pending Actions ────────────────────────────────── */}
          {pendingActions.length > 0 && (
            <View style={styles.sectionPadding}>
              <Text style={styles.sectionTitle}>Pending Actions</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingTop: 12 }}
              >
                {pendingActions.map((action, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.actionCard}
                    onPress={() => {
                      if (action.type === 'RATE_PRIEST') {
                        openRateModal(action);
                      }
                    }}
                  >
                    <View style={styles.actionIcon}>
                      <Ionicons name="star" size={24} color={APP_COLORS.saffron} />
                    </View>
                    <View>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSub}>{action.message}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}



          {/* ── Upcoming Festivals ──────────────────────────────────── */}
          <View style={styles.sectionPadding}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Festivals</Text>
                <TouchableOpacity onPress={() => router.push("/devotee/FestivalsCalendar")}>
                    <Text style={styles.viewAllText}>VIEW ALL</Text>
                </TouchableOpacity>
            </View>
            {banners.length > 1 ? (
              <ScrollView
                horizontal
                pagingEnabled={false}
                decelerationRate="fast"
                snapToInterval={SCREEN_WIDTH - 40 + 16}
                snapToAlignment="center"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16 }}
              >
                {banners.map((banner, index) => {
                  const safeSubtitle =
                    banner.subtitle && /\d+%|off|discount|offer/i.test(banner.subtitle)
                      ? 'Experience the divine energy of this auspicious festival'
                      : banner.subtitle;
                  return (
                    <TouchableOpacity
                      key={banner._id || index}
                      style={styles.bannerWrapper}
                      onPress={() => banner.link ? router.push(banner.link as any) : router.push("/devotee/FestivalsCalendar")}
                    >
                      {banner.image ? (
                        <Image source={{ uri: getImageUri(banner.image) }} style={styles.bannerImage} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={banner.colors || ['#FF9933', '#E65C00']} style={styles.bannerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                          <View style={styles.glassyOverlay}>
                            <Text style={styles.bannerTitle}>{banner.title || "Sacred Festival"}</Text>
                            <Text style={styles.bannerSubtitle}>{safeSubtitle || "Experience the divine energy with our rituals"}</Text>
                            <View style={styles.bannerBottomRow}>
                              <View style={styles.datePill}>
                                <Text style={styles.datePillText}>
                                  {banner.isFestival && banner.date ? 
                                    (banner.date === new Date().toISOString().split('T')[0] ? "TODAY" : 
                                      new Date(banner.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase())
                                    : (banner.date || "TODAY")}
                                </Text>
                              </View>
                              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.bannerArrow} />
                            </View>
                          </View>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <TouchableOpacity
                style={styles.bannerFull}
                activeOpacity={banners.length === 0 ? 1 : 0.85}
                onPress={() => banners.length > 0 && (banners[0].link ? router.push(banners[0].link as any) : router.push("/devotee/FestivalsCalendar"))}
              >
                {banners.length > 0 && banners[0].image ? (
                  <Image source={{ uri: getImageUri(banners[0].image) }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={banners.length > 0 ? (banners[0].colors || ['#CC3B00', '#7E2000']) : ['#CC3B00', '#7E2000']}
                    style={styles.bannerCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.glassyOverlay}>
                      <Text style={styles.bannerTitle}>
                        {banners.length > 0 ? (banners[0].title || "Sacred Festival") : "Stay Blessed 🙏"}
                      </Text>
                      <Text style={styles.bannerSubtitle}>
                        {banners.length > 0
                          ? ((() => {
                              const sub = banners[0].subtitle;
                              return sub && /\d+%|off|discount|offer/i.test(sub)
                                ? 'Experience the divine energy of this auspicious festival'
                                : sub || "Experience the divine energy with our rituals";
                            })())
                          : "Discover upcoming auspicious festivals and book a puja"}
                      </Text>
                      {banners.length > 0 && (
                        <View style={styles.bannerBottomRow}>
                          <View style={styles.datePill}><Text style={styles.datePillText}>{banners[0].date || "TODAY"}</Text></View>
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.bannerArrow} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── Top Rated Pandits ───────────────────────────── */}
          <View style={styles.sectionPadding}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Rated Pandits</Text>
                <TouchableOpacity onPress={() => router.push('/(devoteeScreens)/(priest)/PriestSearch')}>
                  <Text style={styles.viewAllText}>VIEW ALL</Text>
                </TouchableOpacity>
              </View>

              {recommendedPriests.length === 0 ? (
                <View style={styles.emptyPanditBox}>
                  <Ionicons name="person-outline" size={32} color={APP_COLORS.gray} />
                  <Text style={styles.emptyPanditText}>No pandits found nearby</Text>
                  <Text style={styles.emptyPanditSub}>Pull to refresh or expand your search area</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingHorizontal: 4, paddingBottom: 16, paddingTop: 4 }}
                >
                  {[...recommendedPriests]
                    .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
                    .slice(0, 5)
                    .map((priest, index) => {
                      const rating = priest.rating?.average?.toFixed(1) || '—';
                      const isAvailable = priest.isAvailable !== false;
                      const profilePic = priest.profilePic || priest.profilePicture;

                      return (
                        <TouchableOpacity
                          key={priest._id || index}
                          style={styles.panditCard}
                          activeOpacity={0.88}
                          onPress={() => router.push({ pathname: '/(devoteeScreens)/(priest)/PriestDetails', params: { priestId: priest._id } })}
                        >
                          <View style={styles.panditImageWrap}>
                            {profilePic ? (
                              <Image
                                source={{ uri: getImageUri(profilePic) }}
                                style={styles.panditImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.panditImage, styles.panditAvatarFallback]}>
                                <Ionicons name="person" size={32} color={APP_COLORS.tertiary} />
                              </View>
                            )}
                            {isAvailable && (
                              <View style={styles.availableTag}>
                                <View style={styles.greenDot} />
                                <Text style={styles.availableText}>AVAILABLE</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.panditInfo}>
                            <Text style={styles.panditName} numberOfLines={1}>
                              {priest.name || priest.fullName || 'Pandit'}
                            </Text>
                            <View style={styles.ratingPill}>
                              <Ionicons name="star" size={10} color="#D96321" />
                              <Text style={styles.ratingText}>{rating}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              )}
          </View>

          {/* ── Sacred Services ───────────────────────────────── */}
          <View style={styles.sectionPadding}>
             <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>Sacred Services</Text>
             </View>
            <View style={styles.serviceGrid}>
                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push("/devotee/(tabs)/ExploreTab")}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="flower" size={26} color={APP_COLORS.primary} />
                    </View>
                    <Text style={styles.serviceTitle}>Pujas</Text>
                    <Text style={styles.serviceSubtitle}>50+ OPTIONS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push({ pathname: "/devotee/(tabs)/ExploreTab", params: { search: "House Warming" } })}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="home" size={26} color={APP_COLORS.primary} />
                    </View>
                    <Text style={styles.serviceTitle} numberOfLines={1} adjustsFontSizeToFit>Gruhapravesha</Text>
                    <Text style={styles.serviceSubtitle}>NEW BEGINNINGS</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push({ pathname: "/devotee/(tabs)/ExploreTab", params: { search: "Havan" } })}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="flame" size={26} color={APP_COLORS.primary} />
                    </View>
                    <Text style={styles.serviceTitle}>Havan</Text>
                    <Text style={styles.serviceSubtitle}>RITUAL FIRE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.serviceBox} activeOpacity={0.8} onPress={() => router.push("/devotee/FestivalsCalendar")}>
                    <View style={styles.serviceIconWrapWhite}>
                        <Ionicons name="calendar" size={26} color={APP_COLORS.primary} />
                    </View>
                    <Text style={styles.serviceTitle}>Festivals</Text>
                    <Text style={styles.serviceSubtitle}>SEASONAL PUJAS</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
        <RatingModal
          isVisible={rateModalVisible}
          onClose={() => setRateModalVisible(false)}
          onSubmit={handleSubmitRating}
          role="devotee"
          bookingDetails={selectedBookingForRating ? {
            ceremonyType: selectedBookingForRating.ceremonyType || selectedBookingForRating.ceremony,
            date: selectedBookingForRating.date,
            clientName: selectedBookingForRating.priestId?.name || 'Priest'
          } : undefined}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.neutral,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    zIndex: 10,
  },
  searchInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: 10,
    fontSize: 15,
    color: '#000',
  },
  greetingText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRightWrap: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  appTitle: {
      fontSize: 24,
      fontFamily: 'serif',
      fontWeight: 'bold',
      color: APP_COLORS.tertiary,
      marginBottom: 2,
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
  bannerWrapper: {
    width: SCREEN_WIDTH - 40,
    marginRight: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerFull: {
      width: '100%',
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
  bannerImage: {
    width: "100%",
    height: 200,
    borderRadius: 24,
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
  serviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 16,
  },
  serviceBox: {
      width: '47%',
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#F4F4F4',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
  },
  serviceIconWrapWhite: {
      backgroundColor: '#FFF5E6',
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
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
  panditCard: {
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      width: 160,
      padding: 16,
      marginRight: 14,
      borderWidth: 1,
      borderColor: '#F8F8F8',
      shadowColor: "#704214",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
  },
  panditImageWrap: {
      width: 90,
      height: 90,
      borderRadius: 45,
      marginBottom: 12,
      position: 'relative',
      borderWidth: 3,
      borderColor: '#FFF5E6',
  },
  panditImage: {
      width: '100%',
      height: '100%',
      borderRadius: 45,
      backgroundColor: '#EEE',
  },
  panditAvatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F3EFEA',
  },
  emptyPanditBox: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 6,
  },
  emptyPanditText: {
      fontSize: 15,
      fontWeight: '600',
      color: APP_COLORS.tertiary,
  },
  emptyPanditSub: {
      fontSize: 12,
      color: APP_COLORS.gray,
      textAlign: 'center',
  },
  availableTag: {
      position: 'absolute',
      bottom: -4,
      alignSelf: 'center',
      backgroundColor: '#2E8B57',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#FFF',
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
      fontSize: 8,
      fontWeight: 'bold',
  },
  panditInfo: {
      alignItems: 'center',
  },
  panditName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: APP_COLORS.tertiary,
      marginBottom: 6,
      textAlign: 'center',
  },
  ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF5E6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      gap: 4,
  },
  ratingText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#D96321',
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFEFE0',
    width: 280,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.tertiary,
  },
  actionSub: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  bookingMiniCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    width: 240,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingMiniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingMiniCeremony: {
    fontSize: 15,
    fontWeight: '700',
    color: APP_COLORS.tertiary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  bookingMiniBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingMiniDate: {
    fontSize: 13,
    color: APP_COLORS.gray,
    fontWeight: '500',
  },
});

export default HomeScreen;
