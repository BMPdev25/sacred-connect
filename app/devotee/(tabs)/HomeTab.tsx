import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { APP_COLORS } from "../../../constants/Colors";
import devoteeService from "../../../services/devoteeService";
import { getImageUri } from "../../../utils/imageUtils";
import RatingModal from "../../../components/RatingModal";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";
import { useNotifications } from "../../../context/NotificationContext";
import PujariCard from "../../../components/PujariCard";
import ErrorMessage from "../../../components/ErrorMessage";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { useHomeDashboard } from "../../../hooks/useHomeDashboard";
import SectionHeader from "../../../components/ui/SectionHeader";
import CeremonyCard from "../../../components/ui/CeremonyCard";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(WINDOW_WIDTH, 600) : WINDOW_WIDTH;

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isLoading,
    isError,
    refreshing,
    recommendedPriests,
    pendingActions,
    myRequests,
    recentBookings,
    currentCity,
    panchang,
    ceremoniesData,
    banners,
    categories,
    onRefresh,
    loadRequests,
    setPendingActions,
    userInfo,
    userCoords,
    fetchData,
  } = useHomeDashboard();

  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<any>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const openRateModal = (action: any) => {
    setSelectedBookingForRating(action.booking);
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

  const handleCeremonyPress = (ceremony: { _id?: string; id?: string; name: string }) => {
    const id = ceremony._id || ceremony.id;
    if (id) router.push(`/(devoteeScreens)/(pujas)/${id}`);
  };

  const handleRepeatBooking = (booking: any) => {
    if (booking.priestId?._id) {
      router.push(`/(devoteeScreens)/(priest)/PriestDetails?priestId=${booking.priestId._id}`);
    }
  };

  const firstName = userInfo?.name?.split(" ")[0] || "Devotee";

  const NotificationBellInline = () => {
    const { unreadCount, toggleNotifications, showNotifications } = useNotifications();
    return (
      <TouchableOpacity className="relative p-1" onPress={toggleNotifications}>
        <Ionicons
          name={showNotifications ? "notifications" : "notifications-outline"}
          size={22}
          color={APP_COLORS.bodyText}
        />
        {unreadCount > 0 && <View className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LoadingSpinner text="Fetching your spiritual home..." />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-white">
        <ErrorMessage 
          message="We couldn't load the home feed. Please check your connection."
          showRetry
          onRetry={() => fetchData(userCoords || undefined)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_COLORS.saffron} />
        }
      >
        <View className="w-full max-w-[600px] self-center">

          {/* ── Header ─────────────────────────────────────────── */}
          <View 
            className="flex-row items-end justify-between px-5 pb-4 bg-white shadow-sm elevation-3"
            style={{ paddingTop: insets.top + 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
          >
            <View className="flex-1">
              <Text className="text-2xl font-extrabold text-[#1A1A1A] mb-0.5">Namaste, {firstName} 🙏</Text>
              <Text className="text-sm text-[#666666]">What would you like to do today?</Text>
            </View>
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity 
                className="flex-row items-center bg-[#FFF2E0] px-3 py-1.5 rounded-full gap-1" 
                onPress={() => router.push('/(devoteeScreens)/profile/ManageAddresses')}
              >
                <Ionicons name="location" size={14} color={APP_COLORS.saffron} />
                <Text className="text-xs font-semibold text-[#FF9800]">{currentCity}</Text>
              </TouchableOpacity>
              <NotificationBellInline />
            </View>
          </View>

          {/* ── Panchang Widget ────────────────────────────────── */}
          {panchang && (
            <View className="px-4 mt-5">
              <Card 
                className="bg-[#FFF8F0] border-l-4" 
                style={{ borderLeftColor: APP_COLORS.saffron }}
              >
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-full bg-[#FFF3E0] justify-center items-center">
                    <Ionicons name="sunny" size={28} color="#FFA726" />
                  </View>
                  <View className="flex-1 ml-3.5">
                    <Text className="text-base font-bold text-[#1A1A1A] mb-0.5">{panchang.title}</Text>
                    <Text className="text-sm text-[#4A4A4A] mb-2">{panchang.subtitle}</Text>
                    <div className="flex-row gap-2">
                      <View className="bg-[#FFF2E0] px-2.5 py-1 rounded-xl">
                        <Text className="text-[11px] text-[#FF9800] font-semibold">Nakshatra: {panchang.nakshatra}</Text>
                      </View>
                      <View className="bg-[#FFF2E0] px-2.5 py-1 rounded-xl">
                        <Text className="text-[11px] text-[#FF9800] font-semibold">Tithi: {panchang.tithi}</Text>
                      </View>
                    </div>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* ── Hero Carousel ──────────────────────────────────── */}
          <View className="px-4 mt-5">
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
                  key={banner._id}
                  className="rounded-2xl p-5 justify-end overflow-hidden"
                  style={{ width: SCREEN_WIDTH - 32, height: 140, backgroundColor: banner.color }}
                  activeOpacity={0.9}
                >
                  <Ionicons name="megaphone" size={32} color="rgba(255,255,255,0.3)" className="absolute top-4 right-4" />
                  <Text className="text-xl font-extrabold text-white mb-1">{banner.title}</Text>
                  <Text className="text-sm text-white/85 font-medium">{banner.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="flex-row justify-center mt-2.5 gap-1.5">
              {banners.map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 rounded-full ${activeBanner === i ? 'w-5 bg-[#FF9800]' : 'w-1.5 bg-[#E0E0E0]'}`}
                />
              ))}
            </View>
          </View>

          {/* ── Recommended Priests ───────────────────────────── */}
          {recommendedPriests.length > 0 && (
            <View className="mt-6">
              <View className="flex-row justify-between items-center px-4 mb-3">
                <Text className="text-lg font-bold text-[#1A1A1A]">🙏 Recommended Priests</Text>
                <TouchableOpacity onPress={() => router.push('/(devoteeScreens)/(priest)/PriestSearch')}>
                  <Text className="text-sm font-semibold text-[#FF9800]">View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {recommendedPriests.map((priest) => (
                  <View key={priest._id} className="w-[280px] mr-3">
                    <PujariCard pujari={priest} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── My Requests ────────────────────────────────────── */}
          {myRequests.length > 0 && (
            <View className="mt-6">
              <View className="flex-row justify-between items-center px-4 mb-3">
                <Text className="text-lg font-bold text-[#1A1A1A]">📋 My Requests</Text>
                <TouchableOpacity onPress={() => router.push('/devotee/(tabs)/BookingsTab')}>
                  <Text className="text-sm font-semibold text-[#FF9800]">View All</Text>
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
                  
                  return (
                    <View 
                      key={req._id || idx} 
                      className="w-44 bg-white p-3 rounded-2xl mr-3 shadow-sm border-l-4"
                      style={{ borderLeftColor: statusColor }}
                    >
                      <View 
                        className="flex-row items-center self-start px-2 py-0.5 rounded-full mb-2"
                        style={{ backgroundColor: statusBg }}
                      >
                        <Ionicons name={statusIcon as any} size={11} color={statusColor} />
                        <Text className="text-[10px] font-bold ml-1" style={{ color: statusColor }}>{statusLabel}</Text>
                      </View>
                      <Text className="text-sm font-bold text-[#1A1A1A] mb-0.5" numberOfLines={1}>{req.ceremonyType}</Text>
                      <Text className="text-xs text-[#666666] mb-1.5" numberOfLines={1}>{req.priestId?.name || 'Priest'}</Text>
                      <Text className="text-[11px] text-[#9E9E9E]">{new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Pending Actions ────────────────────────────────── */}
          {pendingActions.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-bold text-[#1A1A1A] px-4 mb-3">⚡ Pending Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {pendingActions.map((action, index) => (
                  <Card key={index} className="w-[260px] mr-3 border-l-4" style={{ borderLeftColor: '#F57C00' }}>
                    <View className="flex-row items-center mb-3">
                      <View className="w-11 h-11 rounded-full bg-[#FFF3E0] justify-center items-center">
                        <Ionicons name="star-outline" size={22} color="#F57C00" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-bold text-black">{action.title}</Text>
                        <Text className="text-xs text-[#666666] mt-0.5" numberOfLines={1}>{action.description}</Text>
                      </View>
                    </View>
                    <PrimaryButton title="Rate Experience" onPress={() => openRateModal(action)} size="sm" />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}

          {recentBookings.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-bold text-[#1A1A1A] px-4 mb-3">🔁 Book Again</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {recentBookings.map((item) => (
                  <Card key={item._id} className="w-[170px] mr-3 items-center">
                    <View className="w-12 h-12 rounded-full bg-[#FFF2E0] justify-center items-center mb-2">
                      <Ionicons name="flame" size={24} color="#FF9800" />
                    </View>
                    <Text className="text-sm font-bold text-[#1A1A1A] text-center" numberOfLines={1}>{item.ceremonyType}</Text>
                    <Text className="text-xs text-[#666666] text-center" numberOfLines={1}>{item.priestId?.name}</Text>
                    <Text className="text-[11px] text-[#9E9E9E] mt-0.5">
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                    <PrimaryButton title="Repeat" onPress={() => handleRepeatBooking(item)} size="sm" variant="outline" className="mt-2 w-full" />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Shop by Category ───────────────────────────────── */}
          <View className="mt-6 px-4">
            <SectionHeader title="🕉️ Book by Category" className="mt-0" />
            <View className="flex-row flex-wrap justify-between">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm items-center border border-[#F0F0F0]"
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: "/devotee/(tabs)/ExploreTab",
                    params: { category: cat.slug }
                  })}
                >
                  <View 
                    className="w-14 h-14 rounded-full justify-center items-center mb-2"
                    style={{ backgroundColor: (cat.color || '#FF9800') + '18' }}
                  >
                    <Ionicons name={cat.icon as any} size={32} color={cat.color || '#FF9800'} />
                  </View>
                  <Text className="text-sm font-bold text-[#1A1A1A]" numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Popular Ceremonies (from API) ───────────────────── */}
          <View className="mt-6">
            <View className="flex-row justify-between items-center px-4 mb-3">
              <Text className="text-lg font-bold text-[#1A1A1A]">🌟 Popular Ceremonies</Text>
              <TouchableOpacity onPress={() => router.push("/(devoteeScreens)/(pujas)/AllPujas")}>
                <Text className="text-sm font-semibold text-[#FF9800]">View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {ceremoniesData?.map((ceremony: any) => (
                <CeremonyCard 
                  key={ceremony._id} 
                  ceremony={ceremony} 
                  onPress={() => handleCeremonyPress(ceremony)} 
                />
              ))}
              <TouchableOpacity
                className="w-40 h-48 rounded-2xl mr-3 bg-[#FAFAFA] border-2 border-dashed border-[#E0E0E0] justify-center items-center"
                onPress={() => router.push("/(devoteeScreens)/(pujas)/AllPujas")}
              >
                <Ionicons name="arrow-forward-circle" size={32} color="#FF9800" />
                <Text className="text-sm font-bold text-[#FF9800] mt-1">View All</Text>
              </TouchableOpacity>
            </ScrollView>
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

export default HomeScreen;
