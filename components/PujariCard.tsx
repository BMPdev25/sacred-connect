import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { APP_COLORS } from "../constants/Colors";
import { router } from "expo-router";
import { Pujari } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { getImageUri } from "../utils/imageUtils";

interface Props {
  pujari: Pujari;
  ceremonyId?: string; // useful if we want to show specific price/duration for this ceremony
  onBookPress?: () => void;
}

export default function PujariCard({ pujari, ceremonyId, onBookPress }: Props) {
  // Find specific service details if ceremonyId is provided
  const serviceDetails = ceremonyId
    ? pujari.services?.find((s) => s.ceremonyId === ceremonyId)
    : null;

  // Determine reliability badge
  let reliabilityBadge = null;
  if (pujari.ceremonyCount !== undefined && pujari.ceremonyCount >= 5 && pujari.completionRate !== undefined) {
    if (pujari.completionRate >= 90) reliabilityBadge = "🟢";
    else if (pujari.completionRate >= 70) reliabilityBadge = "🟡";
    else reliabilityBadge = "🔴";
  }

  const handlePress = () => {
    // Navigate to priest profile
    // Note: Adjust route based on actual project structure if different
    router.push(`/(devoteeScreens)/(priest)/PriestDetails?priestId=${pujari._id}${ceremonyId ? '&ceremony=' + ceremonyId : ''}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: getImageUri(pujari.profilePicture, "https://via.placeholder.com/100"),
        }}
        style={styles.image}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {pujari.name} {reliabilityBadge}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {pujari.rating?.average?.toFixed(1) || "New"}
            </Text>
            <Text style={styles.ratingCount}>
              ({pujari.rating?.count || 0})
            </Text>
          </View>
        </View>

        <Text style={styles.languages} numberOfLines={1}>
          Speaks: {pujari.languages?.join(", ") || "English"}
        </Text>

        {serviceDetails && (
          <View style={styles.serviceInfo}>
            <Text style={styles.price}>₹{serviceDetails.price}</Text>
            <Text style={styles.duration}>
              • {serviceDetails.durationMinutes} mins
            </Text>
          </View>
        )}

        {pujari.distance !== undefined && (
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={12} color={APP_COLORS.gray} />
            <Text style={styles.distanceText}>
              {pujari.distance < 1
                ? `${(pujari.distance * 1000).toFixed(0)}m away`
                : `${pujari.distance.toFixed(1)} km away`}
            </Text>
          </View>
        )}

        {(pujari.ceremonyCount !== undefined && pujari.ceremonyCount > 0) && (
          <View style={styles.completedRow}>
            <Ionicons name="checkmark-done" size={14} color={APP_COLORS.success} />
            <Text style={styles.completedText}>
              {pujari.ceremonyCount} Pujas Completed
            </Text>
          </View>
        )}
      </View>

      {onBookPress && (
        <TouchableOpacity
          style={styles.bookButton}
          onPress={(e) => {
            e.stopPropagation();
            onBookPress();
          }}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: APP_COLORS.lightGray,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: APP_COLORS.black,
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: APP_COLORS.black,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginLeft: 2,
  },
  languages: {
    fontSize: 13,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: APP_COLORS.primary,
  },
  duration: {
    fontSize: 13,
    color: APP_COLORS.gray,
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  distanceText: {
    fontSize: 12,
    color: APP_COLORS.gray,
    fontWeight: "500",
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: APP_COLORS.success,
    fontWeight: "600",
  },
  bookButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  bookButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
});
