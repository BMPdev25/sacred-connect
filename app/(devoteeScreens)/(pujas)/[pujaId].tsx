import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
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

export default function PujaDetailScreen() {
  const { pujaId } = useLocalSearchParams<{ pujaId: string }>();
  const router = useRouter();

  // Normalize pujaId (it can be string or array)
  const id = Array.isArray(pujaId) ? pujaId[0] : pujaId;

  // Location state
  const [location, setLocation] = useState<{ lat?: number; lng?: number } | null>(
    null
  );
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // 1. Fetch Location on mount (optional)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationPermissionGranted(true);
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }
      } catch (e) {
        console.log("Location fetch failed or permission denied", e);
      }
    })();
  }, []);

  // 2. Query for Puja Details
  const {
    data: puja,
    isLoading: isPujaLoading,
    error: pujaError,
  } = useQuery<Puja>({
    queryKey: ["puja", id],
    queryFn: () => fetchPujaById(id!),
    enabled: !!id,
  });



  if (isPujaLoading || !id) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  if (pujaError || !puja) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Failed to load puja details. {String(pujaError)}
        </Text>
      </View>
    );
  }

  const handleInstantBooking = async () => {
    if (!locationPermissionGranted) {
      Alert.alert(
        "Location Required",
        "We need your location to find nearby priests for instant booking.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!location?.lat || !location?.lng) {
      Alert.alert("Error", "Unable to get your current location. Please try again.");
      return;
    }

    // Navigate to Instant Search Screen
    router.push({
      pathname: '/(devoteeScreens)/(bookings)/InstantSearch' as any,
      params: {
        pujaId: id,
        ceremonyType: puja.name,
        latitude: location.lat,
        longitude: location.lng,
        address: "Current Location",
        city: "Nearby",
      }
    });
  };

  const handleScheduleBooking = () => {
    router.push({
      pathname: "/(devoteeScreens)/(priest)/PriestSearch" as any,
      params: { ceremony: puja.name }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          title: puja.name,
          headerTintColor: APP_COLORS.black,
          headerStyle: { backgroundColor: APP_COLORS.white },
          headerShadowVisible: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: puja.image || "https://via.placeholder.com/400x200" }}
          style={styles.headerImage}
          resizeMode="cover"
        />

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{puja.name}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={APP_COLORS.gray} />
            <Text style={styles.metaText}>
              {typeof puja.duration === "object"
                ? puja.duration.typical
                : puja.duration}{" "}
              mins (approx)
            </Text>
          </View>

          <View style={styles.instantCard}>
            <View style={styles.instantContent}>
              <View style={styles.instantBadge}>
                <Ionicons name="flash" size={12} color={APP_COLORS.white} />
                <Text style={styles.instantBadgeText}>INSTANT</Text>
              </View>
              <Text style={styles.instantTitle}>Need this Puja urgently?</Text>
              <Text style={styles.instantDesc}>Book a verified priest within 5 mins for immediate requirements.</Text>
            </View>
            <TouchableOpacity style={styles.instantBtn} onPress={handleInstantBooking}>
              <Text style={styles.instantBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>About this Puja</Text>
          <Text style={styles.description}>{puja.description}</Text>

          {puja.history && (
            <>
              <Text style={styles.sectionHeader}>History & Significance</Text>
              <Text style={styles.description}>{puja.history}</Text>
            </>
          )}

          {/* Duration Breakdown */}
          {puja.duration && typeof puja.duration === "object" && (
            <>
              <Text style={styles.sectionHeader}>Duration</Text>
              <View style={styles.durationCard}>
                <View style={styles.durationItem}>
                  <Text style={styles.durationLabel}>Typical</Text>
                  <Text style={styles.durationValue}>{puja.duration.typical} min</Text>
                </View>
                <View style={styles.durationItem}>
                  <Text style={styles.durationLabel}>Minimum</Text>
                  <Text style={styles.durationValue}>{puja.duration.minimum} min</Text>
                </View>
                <View style={styles.durationItem}>
                  <Text style={styles.durationLabel}>Maximum</Text>
                  <Text style={styles.durationValue}>{puja.duration.maximum} min</Text>
                </View>
              </View>
            </>
          )}

          {puja.ritualSteps && puja.ritualSteps.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>What This Puja Includes</Text>
              <View style={styles.stepsContainer}>
                {[...puja.ritualSteps]
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <View style={styles.stepHeaderRow}>
                          <Text style={styles.stepTitle}>{step.title}</Text>
                          {step.durationEstimate && (
                            <Text style={styles.stepDuration}>
                              ~{step.durationEstimate} min
                            </Text>
                          )}
                        </View>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                      </View>
                    </View>
                  ))}
              </View>
            </>
          )}

          <Text style={styles.sectionHeader}>Samagri (Materials Required)</Text>
          {puja.requirements?.materials &&
            puja.requirements.materials.length > 0 ? (
            <View style={styles.samagriContainer}>
              {puja.requirements.materials.map((req: any, index: number) => (
                <View key={index} style={styles.samagriItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={req.isOptional ? APP_COLORS.gray : APP_COLORS.primary}
                  />
                  <View style={styles.samagriInfo}>
                    <Text style={styles.samagriName}>
                      {typeof req === "string" ? req : req.name}
                      {req.isOptional && <Text style={styles.samagriOptional}> (Optional)</Text>}
                    </Text>
                    {req.quantity && (
                      <Text style={styles.samagriDetail}>
                        Qty: {req.quantity}
                        {req.providedBy ? ` · Provided by: ${req.providedBy}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.description}>
              No special requirements specified.
            </Text>
          )}

          {/* Special Instructions */}
          {puja.requirements?.specialInstructions && puja.requirements.specialInstructions.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Special Instructions</Text>
              <View style={styles.instructionsContainer}>
                {puja.requirements.specialInstructions.map((instr: string, idx: number) => (
                  <View key={idx} style={styles.instrRow}>
                    <Ionicons name="alert-circle" size={16} color={APP_COLORS.warning} />
                    <Text style={styles.instrText}>{instr}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.price}>₹{puja.pricing?.basePrice || puja.basePrice || "2100"}</Text>
        </View>
        <TouchableOpacity style={styles.scheduleBtn} onPress={handleScheduleBooking}>
          <Text style={styles.scheduleBtnText}>Schedule for Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    width: Platform.OS === 'web' ? '100%' : undefined,
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  headerImage: {
    width: "100%",
    height: 300,
    alignSelf: 'center',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: APP_COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20, // Overlap image slightly
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: APP_COLORS.black,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  metaText: {
    marginLeft: 6,
    color: APP_COLORS.gray,
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: APP_COLORS.black,
    marginTop: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: APP_COLORS.gray,
    lineHeight: 22,
  },
  reqItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  reqText: {
    marginLeft: 8,
    color: APP_COLORS.gray,
    fontSize: 14,
    flex: 1,
  },
  locationHint: {
    fontSize: 12,
    color: APP_COLORS.gray,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  errorText: {
    color: APP_COLORS.error,
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  noDataText: {
    color: APP_COLORS.gray,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  pujariList: {
    marginTop: 8,
  },
  stepsContainer: {
    marginTop: 8,
  },
  instantCard: {
    backgroundColor: APP_COLORS.primary + "10",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.primary + "30",
  },
  instantContent: {
    flex: 1,
    marginRight: 12,
  },
  instantBadge: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  instantBadgeText: {
    color: APP_COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  instantTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.black,
    marginBottom: 4,
  },
  instantDesc: {
    fontSize: 12,
    color: APP_COLORS.gray,
    lineHeight: 18,
  },
  instantBtn: {
    backgroundColor: APP_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  instantBtnText: {
    color: APP_COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  scheduleBtn: {
    backgroundColor: APP_COLORS.saffron,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  scheduleBtnText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  stepItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: APP_COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: APP_COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: APP_COLORS.black,
    flex: 1,
  },
  stepDuration: {
    fontSize: 12,
    color: APP_COLORS.gray,
    fontStyle: "italic",
    marginLeft: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: APP_COLORS.gray,
    lineHeight: 20,
  },
  // Duration Styles
  durationCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: APP_COLORS.primary + "08",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  durationItem: {
    alignItems: "center",
  },
  durationLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  // Samagri Styles
  samagriContainer: {
    marginTop: 8,
  },
  samagriItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  samagriInfo: {
    marginLeft: 8,
    flex: 1,
  },
  samagriName: {
    fontSize: 14,
    color: APP_COLORS.black,
    fontWeight: "500",
  },
  samagriOptional: {
    fontSize: 12,
    color: APP_COLORS.gray,
    fontStyle: "italic",
    fontWeight: "normal",
  },
  samagriDetail: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 2,
  },
  // Instructions Styles
  instructionsContainer: {
    backgroundColor: APP_COLORS.warning + "10",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: APP_COLORS.warning,
  },
  instrRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  instrText: {
    fontSize: 14,
    color: APP_COLORS.black,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
