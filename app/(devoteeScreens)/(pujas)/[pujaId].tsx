import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { fetchPujaById } from "../../../services/pujaApi";
import { APP_COLORS } from "../../../constants/Colors";
import { Puja } from "../../../types";
import SectionHeader from "../../../components/ui/SectionHeader";
import InstantBookingCard from "../../../components/ui/InstantBookingCard";

export default function PujaDetailScreen() {
  const { pujaId } = useLocalSearchParams<{ pujaId: string }>();
  const router = useRouter();
  const id = Array.isArray(pujaId) ? pujaId[0] : pujaId;

  const [location, setLocation] = useState<{ lat?: number; lng?: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationPermissionGranted(true);
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (e) {
        console.log("Location fetch failed", e);
      }
    })();
  }, []);

  const { data: puja, isLoading, error } = useQuery<Puja>({
    queryKey: ["puja", id],
    queryFn: () => fetchPujaById(id!),
    enabled: !!id,
  });

  if (isLoading || !id) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  if (error || !puja) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-5">
        <Text className="text-red-500 text-center">Failed to load puja details.</Text>
      </View>
    );
  }

  const handleInstantBooking = () => {
    if (!locationPermissionGranted) {
      Alert.alert("Location Required", "We need location to find nearby priests.");
      return;
    }
    router.push({
      pathname: '/(devoteeScreens)/(bookings)/InstantSearch' as any,
      params: { 
        pujaId: id, 
        ceremonyType: puja.name, 
        latitude: location?.lat, 
        longitude: location?.lng,
        address: "Current Location",
        city: "Nearby"
      }
    });
  };

  return (
    <View className="flex-1 bg-white self-center w-full" style={{ maxWidth: Platform.OS === 'web' ? 700 : undefined }}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: puja.name, headerShadowVisible: true }} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <Image 
          source={{ uri: puja.image || "https://via.placeholder.com/400x200" }} 
          className="w-full h-[300px]" 
          resizeMode="cover" 
        />

        <View className="p-4 bg-white rounded-t-[20px] -mt-5 shadow-sm elevation-5">
          <Text className="text-2xl font-bold text-[#1A1A1A] mb-2">{puja.name}</Text>
          <View className="flex-row items-center mb-4">
            <Ionicons name="time-outline" size={16} color="#666666" />
            <Text className="ml-1.5 text-[#666666] text-sm">
              {typeof puja.duration === "object" ? puja.duration.typical : puja.duration} mins (approx)
            </Text>
          </View>

          <InstantBookingCard onPress={handleInstantBooking} />

          <SectionHeader title="About this Puja" className="mt-4" />
          <Text className="text-sm text-[#666666] leading-6">{puja.description}</Text>

          {puja.history && (
            <>
              <SectionHeader title="History & Significance" />
              <Text className="text-sm text-[#666666] leading-6">{puja.history}</Text>
            </>
          )}

          {puja.ritualSteps && puja.ritualSteps.length > 0 && (
            <>
              <SectionHeader title="What This Puja Includes" />
              <View className="mt-2">
                {[...puja.ritualSteps].sort((a,b) => a.stepNumber - b.stepNumber).map((step, index) => (
                  <View key={index} className="flex-row mb-4">
                    <View className="w-7 h-7 rounded-full bg-[#primary15] justify-center items-center mr-3 mt-0.5" style={{ backgroundColor: APP_COLORS.primary + '15' }}>
                      <Text className="text-[#primary] font-bold text-sm" style={{ color: APP_COLORS.primary }}>{step.stepNumber}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-base font-semibold text-[#1A1A1A] flex-1">{step.title}</Text>
                        {step.durationEstimate && <Text className="text-xs text-[#666666] italic ml-2">~{step.durationEstimate} min</Text>}
                      </View>
                      <Text className="text-sm text-[#666666] leading-5">{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <SectionHeader title="Samagri (Materials Required)" />
          {puja.requirements?.materials?.length > 0 ? (
            <View className="mt-2">
              {puja.requirements.materials.map((req: any, index: number) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle-outline" size={16} color={req.isOptional ? "#666666" : APP_COLORS.primary} />
                  <View className="ml-2 flex-1">
                    <Text className="text-sm font-medium text-[#1A1A1A]">
                      {typeof req === "string" ? req : req.name}
                      {req.isOptional && <Text className="text-xs text-[#666666] italic font-normal"> (Optional)</Text>}
                    </Text>
                    {req.quantity && <Text className="text-xs text-[#666666] mt-0.5">Qty: {req.quantity}</Text>}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-[#666666] italic">No special requirements specified.</Text>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white p-4 flex-row items-center justify-between border-t border-[#EEEEEE] shadow-lg elevation-10">
        <View className="flex-1">
          <Text className="text-xs text-[#666666]">Starting from</Text>
          <Text className="text-xl font-bold text-[#primary]" style={{ color: APP_COLORS.primary }}>₹{puja.pricing?.basePrice || puja.basePrice || "2100"}</Text>
        </View>
        <TouchableOpacity 
          className="bg-[#FF9800] py-3 px-6 rounded-xl" 
          onPress={() => router.push({ pathname: "/(devoteeScreens)/(priest)/PriestSearch", params: { ceremony: puja.name }})}
        >
          <Text className="text-white text-base font-bold">Schedule for Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
