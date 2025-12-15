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
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { fetchPujaById, fetchPujarisForPuja } from "../../../services/pujaApi";
import PujariCard from "../../../components/PujariCard";
import { APP_COLORS } from "../../../constants/Colors";
import { Puja, Pujari } from "../../../types";

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

  // 3. Query for Available Pujaris
  // Re-fetch when location changes or id changes
  const {
    data: pujaris,
    isLoading: isPujarisLoading,
    error: pujarisError,
  } = useQuery<Pujari[]>({
    queryKey: ["pujaris", id, location?.lat, location?.lng],
    queryFn: () =>
      fetchPujarisForPuja(id!, location?.lat, location?.lng, 10), // default radius 10km
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: puja.name,
          headerTintColor: APP_COLORS.black,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Image */}
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

          <Text style={styles.sectionHeader}>About this Puja</Text>
          <Text style={styles.description}>{puja.description}</Text>

          <Text style={styles.sectionHeader}>Requirements</Text>
          {puja.requirements?.materials &&
            puja.requirements.materials.length > 0 ? (
            puja.requirements.materials.map((req: any, index: number) => (
              <View key={index} style={styles.reqItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={APP_COLORS.primary}
                />
                <Text style={styles.reqText}>
                  {typeof req === "string"
                    ? req
                    : `${req.quantity || ""} ${req.name}`}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.description}>
              No special requirements specified.
            </Text>
          )}

          <Text style={styles.sectionHeader}>Available Pujaris Nearby</Text>
          {!locationPermissionGranted && (
            <Text style={styles.locationHint}>
              Enable location to see pujaris near you. Showing top rated.
            </Text>
          )}

          {isPujarisLoading ? (
            <ActivityIndicator size="small" color={APP_COLORS.primary} style={{ marginTop: 20 }} />
          ) : pujarisError ? (
            <Text style={styles.errorText}>Unable to load pujaris.</Text>
          ) : pujaris && pujaris.length === 0 ? (
            <Text style={styles.noDataText}>No pujaris available for this ceremony currently.</Text>
          ) : (
            <View style={styles.pujariList}>
              {pujaris?.map((pujari) => (
                <PujariCard key={pujari._id} pujari={pujari} ceremonyId={id} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerImage: {
    width: "100%",
    height: 200,
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
});
