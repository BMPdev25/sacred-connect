import { Ionicons } from "@expo/vector-icons";
import { getImageUri } from "../../../utils/imageUtils";

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_COLORS } from "../../../constants/Colors";
import devoteeService from "../../../services/devoteeService";

// Local types for priest data
type Review = {
  id: string | number;
  user?: string;
  rating?: number;
  date?: string;
  comment?: string;
};

type Ceremony = {
  id?: string | number;
  name?: string;
  price?: number;
  ritualSteps?: { 
    title: string; 
    description: string;
    stepNumber?: number;
    durationEstimate?: number;
    extraCharge?: number;
  }[];
  customSteps?: { 
    title: string; 
    description: string;
    durationEstimate?: number;
    additionalCharge?: number;
    extraCharge?: number;
  }[];
};

type WeeklyAvailabilityEntry = {
  available?: boolean;
  startTime?: string;
  endTime?: string;
};

type Priest = {
  id?: string | number;
  profilePicture?: string;
  name?: string;
  religiousTradition?: string;
  experience?: number;
  ratings?: { average?: number; count?: number };
  availability?: string;
  description?: string;
  about?: string;
  templeAffiliation?: { name?: string; address?: string };
  languages?: string[];
  certifications?: string[];
  ceremonies?: Ceremony[];
  reviews?: Review[];
  weeklyAvailability?: Record<string, WeeklyAvailabilityEntry>;
  ceremonyCount?: number;
  completionRate?: number;
  cancelledCount?: number;
  noShowCount?: number;
};

const PriestDetails: React.FC = () => {
  const { priestId, ceremony } = useLocalSearchParams();
  const priestIdStr = Array.isArray(priestId) ? priestId[0] : priestId;
  const [priest, setPriest] = useState<Priest | null>(null);
  const [selectedTab, setSelectedTab] = useState("about");
  const [isLoading, setIsLoading] = useState(true);
  const [showReliabilityModal, setShowReliabilityModal] = useState(false);
  const [expandedCeremonyId, setExpandedCeremonyId] = useState<string | number | null>(null);

  // Fetch priest data from API
  useEffect(() => {
    const fetchPriestDetails = async () => {
      try {
        console.log("PriestDetails: Fetching for priestIdStr:", priestIdStr);
        
        // 1. Fetch master ceremony list for name resolution
        let masterCeremonies: any[] = [];
        try {
          const res = await devoteeService.getCeremonies();
          masterCeremonies = Array.isArray(res) ? res : (res.ceremonies || []);
        } catch (e) {
          console.warn("Failed to fetch master ceremony list", e);
        }

        // 2. Fetch priest details
        const data = await devoteeService.getPriestDetails(priestIdStr);
        
        // 3. Map priest services/ceremonies with name resolution
        if (data && data.services) {
          data.ceremonies = data.services.map((s: any) => {
            let ceremonyName = s.ceremonyName || s.name;
            
            // If name is unknown or missing, try to resolve from master list
            if (!ceremonyName || ceremonyName === "Unknown Ceremony") {
              const masterMatch = masterCeremonies.find(m => 
                m._id === s.ceremonyId || 
                (m.basePrice === s.price && m.name.toLowerCase().includes('satyanarayan') && (ceremony as string)?.toLowerCase().includes('satyanarayan'))
              );
              ceremonyName = masterMatch?.name || s.ceremonyId || "Ceremony";
            }
            
            return {
              id: s.ceremonyId || s._id,
              name: ceremonyName,
              price: s.price,
              ritualSteps: s.ritualSteps || [],
              customSteps: s.customSteps || []
            };
          });
        } else if (data && data.ceremonies && data.ceremonies.length > 0) {
          // Fix names if they are already objects but have 'Unknown Ceremony'
          data.ceremonies = data.ceremonies.map((c: any) => {
            let ceremonyName = typeof c === 'string' ? c : (c.name || "Ceremony");
            let price = typeof c === 'string' ? 2100 : (c.price || 2100);
            let id = typeof c === 'string' ? undefined : (c.id || c._id);

            if (ceremonyName === "Unknown Ceremony" || !ceremonyName) {
              const masterMatch = masterCeremonies.find(m => 
                m._id === id || 
                (m.basePrice === price && (ceremony as string)?.toLowerCase().includes(m.name.toLowerCase().split(' ')[0]))
              );
              ceremonyName = masterMatch?.name || (ceremony as string) || "Ceremony";
            }

            return {
              id: id,
              name: ceremonyName,
              price: price,
              ritualSteps: c.ritualSteps || [],
              customSteps: c.customSteps || []
            };
          });
        }

        // 4. Default ritual steps are now handled by the backend if present in Ceremony model
        // No client-side fallback needed if we trust the DB seeding.
        setPriest(data);
      } catch (error) {
        console.error("Failed to fetch priest details:", error);
        Alert.alert("Error", "Failed to load priest details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriestDetails();
  }, [priestIdStr]);

  const handleBookNow = () => {
    if (!priestIdStr) return;
    router.push({
      pathname: "/[BookCeremony]",
      params: { BookCeremony: priestIdStr, priestId: priestIdStr, ceremony },
    });
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{item.user}</Text>
        <View style={styles.reviewRating}>
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Ionicons
                key={index}
                name={index < (item.rating || 0) ? "star" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
        </View>
      </View>
      <Text style={styles.reviewDate}>{item.date}</Text>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Priest Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Profile skeleton */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: APP_COLORS.lightGray, marginBottom: 12 }} />
            <View style={{ width: 160, height: 20, borderRadius: 4, backgroundColor: APP_COLORS.lightGray, marginBottom: 8 }} />
            <View style={{ width: 120, height: 14, borderRadius: 4, backgroundColor: APP_COLORS.lightGray }} />
          </View>
          {/* Stats row skeleton */}
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 24 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ alignItems: "center" }}>
                <View style={{ width: 40, height: 20, borderRadius: 4, backgroundColor: APP_COLORS.lightGray, marginBottom: 4 }} />
                <View style={{ width: 60, height: 12, borderRadius: 4, backgroundColor: APP_COLORS.lightGray }} />
              </View>
            ))}
          </View>
          {/* Content lines skeleton */}
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ width: `${90 - i * 10}%`, height: 14, borderRadius: 4, backgroundColor: APP_COLORS.lightGray, marginBottom: 12 }} />
          ))}
          <ActivityIndicator size="small" color={APP_COLORS.primary} style={{ marginTop: 16 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!priest) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Priest details not available.</Text>
      </View>
    );
  }

  let reliabilityBadge = "⚪";
  let reliabilityColor = APP_COLORS.gray;
  let reliabilityText = "New Priest";
  
  if (priest.ceremonyCount !== undefined && priest.ceremonyCount > 0) {
    if (priest.ceremonyCount >= 5 && priest.completionRate !== undefined) {
      if (priest.completionRate >= 90) { reliabilityBadge = "🟢"; reliabilityColor = APP_COLORS.success; reliabilityText = "Excellent"; }
      else if (priest.completionRate >= 70) { reliabilityBadge = "🟡"; reliabilityColor = "#FFC107"; reliabilityText = "Good"; }
      else { reliabilityBadge = "🔴"; reliabilityColor = APP_COLORS.error; reliabilityText = "Below Average"; }
    } else {
      // For priests with 1-4 ceremonies, show as "Rising Star" or similar if they have 100% completion
      reliabilityBadge = "🔵";
      reliabilityColor = APP_COLORS.primary;
      reliabilityText = priest.completionRate && priest.completionRate === 100 ? "Reliable (New)" : "Initial Phase";
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Priest Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          {/* Implement this later */}
          <Ionicons
            name="share-social-outline"
            size={24}
            color={APP_COLORS.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.profileSection}>
          {priest.profilePicture ? (
            <Image
              source={{ uri: getImageUri(priest.profilePicture) }}
              style={styles.profileImage}
            />
          ) : (
            <View
              style={[
                styles.profileImage,
                {
                  backgroundColor: "#f0f0f0",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Ionicons name="person" size={40} color="#ccc" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }} 
              onPress={() => { if (reliabilityBadge) setShowReliabilityModal(true); }}
              activeOpacity={reliabilityBadge ? 0.7 : 1}
            >
              <Text style={[styles.priestName, { marginBottom: 0 }]}>
                {priest.name || "Unknown Priest"}
              </Text>
              {reliabilityBadge && (
                <Text style={{ fontSize: 18, marginLeft: 6 }}>{reliabilityBadge}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statsRow}
              onPress={() => setShowReliabilityModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.statBox}>
                <Ionicons name="checkmark-done-circle" size={16} color={APP_COLORS.success} />
                <Text style={styles.statText}>
                  {priest.ceremonyCount || 0} Pujas Completed
                </Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statusIndicator, { backgroundColor: reliabilityColor, margin: 0, marginRight: 4 }]} />
                <Text style={[styles.statText, { marginLeft: 0 }]}>
                  {reliabilityText}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.priestMeta}>
              <Text style={styles.priestDetail}>
                {priest.religiousTradition || "Hinduism"}
              </Text>
              <Text style={styles.priestDetail}>
                {priest.experience || 0} years exp
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {priest.ratings?.average || 0} ({priest.ratings?.count || 0}{" "}
                reviews)
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  priest.availability === "available"
                    ? styles.availableIndicator
                    : styles.unavailableIndicator,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  priest.availability === "available"
                    ? styles.availableText
                    : styles.unavailableText,
                ]}
              >
                {priest.availability === "available"
                  ? "Available Now"
                  : "Currently Busy"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "about" && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab("about")}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === "about" && styles.activeTabButtonText,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "ceremonies" && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab("ceremonies")}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === "ceremonies" && styles.activeTabButtonText,
              ]}
            >
              Ceremonies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "reviews" && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab("reviews")}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === "reviews" && styles.activeTabButtonText,
              ]}
            >
              Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "availability" && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab("availability")}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === "availability" && styles.activeTabButtonText,
              ]}
            >
              Availability
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === "about" && (
          <View style={styles.tabContent}>
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>
                {priest.description ||
                  priest.about ||
                  "No description available"}
              </Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Temple Affiliation</Text>
              <View style={styles.affiliationContainer}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={APP_COLORS.gray}
                />
                <Text style={styles.affiliationText}>
                  {priest.templeAffiliation?.name || "No temple"},{" "}
                  {priest.templeAffiliation?.address || "No address"}
                </Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.languagesContainer}>
                {(priest.languages || []).map(
                  (language: string, index: number) => (
                    <View key={index} style={styles.languageBadge}>
                      <Text style={styles.languageText}>{language}</Text>
                    </View>
                  )
                )}
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              {(priest.certifications || []).map(
                (certification: string, index: number) => (
                  <View key={index} style={styles.certificationRow}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={APP_COLORS.success}
                    />
                    <Text style={styles.certificationText}>
                      {certification}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {selectedTab === "ceremonies" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Ceremonies & Pricing</Text>
            {(priest.ceremonies || []).map(
              (ceremony: Ceremony, index: number) => {
                const isExpanded = expandedCeremonyId === (ceremony.id || index);
                return (
                  <View key={index} style={styles.ceremonyItemContainer}>
                    <TouchableOpacity 
                      style={styles.ceremonyRow}
                      onPress={() => setExpandedCeremonyId(isExpanded ? null : (ceremony.id || index))}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ceremonyName}>{ceremony.name}</Text>
                        <Text style={styles.ceremonyDuration}>
                          Includes Standard Rituals + {ceremony.customSteps?.length || 0} Custom Additions
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.ceremonyPrice}>₹{ceremony.price}</Text>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={APP_COLORS.gray} 
                          style={{ marginLeft: 8 }} 
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.stepsContainer}>
                        {/* Standard Steps */}
                        {ceremony.ritualSteps && ceremony.ritualSteps.length > 0 && (
                          <View style={styles.stepsSection}>
                            <Text style={styles.stepsSectionTitle}>Section 1: What This Puja Includes</Text>
                            {ceremony.ritualSteps.map((step, sIdx) => (
                              <View key={`std-${sIdx}`} style={styles.stepItem}>
                                <View style={styles.stepDot} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.stepTitle}>{step.title}</Text>
                                  <Text style={styles.stepDesc}>{step.description}</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Custom Steps */}
                        {ceremony.customSteps && ceremony.customSteps.length > 0 && (
                          <View style={[styles.stepsSection, { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                              <Ionicons name="sparkles" size={16} color={APP_COLORS.primary} style={{ marginRight: 6 }} />
                              <Text style={[styles.stepsSectionTitle, { marginBottom: 0 }]}>Section 2: Additional Inclusions by This Priest</Text>
                            </View>
                            {ceremony.customSteps.map((step, sIdx) => {
                              // Handle both extraCharge (old) and additionalCharge (new) names
                              const charge = step.additionalCharge || step.extraCharge;
                              return (
                                <View key={`cust-${sIdx}`} style={styles.stepItem}>
                                  <View style={[styles.stepDot, { backgroundColor: APP_COLORS.primary }]} />
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text style={styles.stepTitle}>{step.title}</Text>
                                      {charge !== undefined && charge > 0 && (
                                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: APP_COLORS.primary }}>+ ₹{charge}</Text>
                                      )}
                                    </View>
                                    <Text style={styles.stepDesc}>{step.description}</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}

                        {(!ceremony.ritualSteps || ceremony.ritualSteps.length === 0) && (!ceremony.customSteps || ceremony.customSteps.length === 0) && (
                          <Text style={{ fontSize: 13, color: APP_COLORS.gray, fontStyle: 'italic', padding: 12 }}>
                            No specific ritual steps detailed for this ceremony.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              }
            )}
            <Text style={styles.pricingNote}>
              * Additional charges may apply for travel beyond 15km and for
              ceremonies lasting more than 3 hours.
            </Text>
          </View>
        )}

        {selectedTab === "reviews" && (
          <View style={styles.tabContent}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionHeading}>User Reviews</Text>
            </View>
            {priest.reviews && priest.reviews.length > 0 ? (
              priest.reviews.map((review, index) => (
                <View key={review.id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{review.user || "Devotee"}</Text>
                    <View style={styles.reviewRating}>
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < (review.rating || 0) ? "star" : "star-outline"}
                            size={16}
                            color="#FFD700"
                          />
                        ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No reviews yet for this priest.</Text>
            )}
          </View>
        )}

        {selectedTab === "availability" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Weekly Availability</Text>
            {(
              Object.entries(priest.weeklyAvailability || {}) as [
                string,
                WeeklyAvailabilityEntry
              ][]
            ).map(([day, data]) => (
              <View key={day} style={styles.availabilityRow}>
                <Text style={styles.dayName}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                {data.available ? (
                  <View style={styles.timeRange}>
                    <Text style={styles.timeText}>
                      {data.startTime} - {data.endTime}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.unavailableDay}>Not Available</Text>
                )}
              </View>
            ))}
            <Text style={styles.availabilityNote}>
              * Priest may have limited availability on some days due to
              previously booked ceremonies.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerPriceInfo}>
          {priest.ceremonies && priest.ceremonies.length > 0 ? (
            <>
              <Text style={styles.startingFrom}>Starting from</Text>
              <Text style={styles.priceValue}>
                ₹{Math.min(...priest.ceremonies.map((c) => c.price || 0))}
              </Text>
            </>
          ) : (
            <Text style={styles.startingFrom}>Contact for Pricing</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            priest.availability !== "available" && styles.disabledBookButton,
          ]}
          onPress={handleBookNow}
          disabled={priest.availability !== "available"}
        >
          <Text style={styles.bookButtonText}>
            {priest.availability === "available" ? "Book Now" : "Not Available"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reliability Modal */}
      <Modal
        visible={showReliabilityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReliabilityModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReliabilityModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Reliability Score</Text>
            
            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              <Text style={{ fontSize: 48 }}>{reliabilityBadge}</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: reliabilityColor, marginTop: 8 }}>{reliabilityText}</Text>
            </View>

            <View style={styles.modalStatRow}>
              <Text style={styles.modalStatLabel}>Completion Rate:</Text>
              <Text style={styles.modalStatValue}>{priest?.completionRate}%</Text>
            </View>

            <View style={styles.modalStatRow}>
              <Text style={styles.modalStatLabel}>Bookings Completed:</Text>
              <Text style={styles.modalStatValue}>{priest?.ceremonyCount || 0}</Text>
            </View>

            <View style={styles.modalStatRow}>
              <Text style={styles.modalStatLabel}>Cancelled (by Priest):</Text>
              <Text style={styles.modalStatValue}>{priest?.cancelledCount || 0}</Text>
            </View>

            <View style={styles.modalStatRow}>
              <Text style={styles.modalStatLabel}>No-shows:</Text>
              <Text style={styles.modalStatValue}>{priest?.noShowCount || 0}</Text>
            </View>

            <View style={styles.modalStatRow}>
              <Text style={styles.modalStatLabel}>Current Rating:</Text>
              <Text style={styles.modalStatValue}>{priest?.ratings?.average || 0} / 5</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              This score indicates the priest's reliability based on their history of completing accepted bookings. (Requires minimum 5 bookings)
            </Text>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowReliabilityModal(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  priestName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  priestMeta: {
    flexDirection: "row",
    marginBottom: 4,
  },
  priestDetail: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginLeft: 4,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availableIndicator: {
    backgroundColor: APP_COLORS.success,
  },
  unavailableIndicator: {
    backgroundColor: APP_COLORS.error,
  },
  statusText: {
    fontSize: 14,
  },
  availableText: {
    color: APP_COLORS.success,
  },
  unavailableText: {
    color: APP_COLORS.error,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  activeTabButtonText: {
    color: APP_COLORS.primary,
    fontWeight: "bold",
  },
  tabContent: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    minHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.black,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: APP_COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  aboutSection: {
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: APP_COLORS.black,
  },
  affiliationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  affiliationText: {
    marginLeft: 8,
    fontSize: 14,
    color: APP_COLORS.black,
  },
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageBadge: {
    backgroundColor: APP_COLORS.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 14,
    color: APP_COLORS.primary,
  },
  certificationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  certificationText: {
    marginLeft: 8,
    fontSize: 14,
    color: APP_COLORS.black,
  },
  ceremonyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  ceremonyName: {
    fontSize: 16,
    fontWeight: "500",
  },
  ceremonyPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  pricingNote: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 12,
    fontStyle: "italic",
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  overallRating: {
    fontSize: 16,
    marginLeft: 4,
  },
  reviewCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "500",
  },
  timeRange: {
    backgroundColor: APP_COLORS.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeText: {
    fontSize: 12,
    color: APP_COLORS.primary,
  },
  unavailableDay: {
    fontSize: 14,
    color: APP_COLORS.error,
  },
  availabilityNote: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 12,
    fontStyle: "italic",
  },
  footer: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  footerPriceInfo: {
    flex: 1,
  },
  startingFrom: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.primary,
  },
  bookButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledBookButton: {
    backgroundColor: APP_COLORS.gray,
  },
  bookButtonText: {
    color: APP_COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  modalStatLabel: {
    fontSize: 16,
    color: APP_COLORS.gray,
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalDescription: {
    fontSize: 12,
    color: APP_COLORS.gray,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: APP_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  ceremonyDuration: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 2,
  },
  ceremonyItemContainer: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
    overflow: 'hidden',
  },
  stepsContainer: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stepsSection: {
    marginBottom: 16,
  },
  stepsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: APP_COLORS.black,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP_COLORS.gray,
    marginTop: 6,
    marginRight: 10,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.black,
  },
  stepDesc: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 2,
  },
});

export default PriestDetails;
