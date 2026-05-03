import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import * as Location from 'expo-location';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { APP_COLORS } from "../../../constants/Colors";
import devoteeService from "../../../services/devoteeService";
import PujariCard from "../../../components/PujariCard";

import { Priest } from "../../../types";
import { calculateDistance } from "../../../utils/locationUtils";

const PriestSearch: React.FC = () => {
  const params = useLocalSearchParams();
  const initialSearchQuery: string =
    typeof params.query === "string" ? params.query : "";
  const initialCeremony: string =
    typeof params.ceremony === "string" ? params.ceremony : "";

  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedCeremony, setSelectedCeremony] =
    useState<string>(initialCeremony);
  const [selectedReligion, setSelectedReligion] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for ceremonies
  const ceremonies = [
    "Wedding",
    "Griha Pravesh",
    "Baby Naming",
    "Satyanarayan Puja",
    "Festival Pujas",
    "Funeral Ceremony",
    "All Ceremonies",
  ];

  // Mock data for religions
  const religions = ["Hinduism", "Buddhism", "Jainism", "Sikhism"];

  // Mock data for ratings
  const ratings = ["4.5 & above", "4.0 & above", "3.5 & above", "Any rating"];

  // Dynamic priest data from API
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch priests function
  const fetchPriests = async (query = "", ceremony = "", religion = "", rating = "") => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (query) params.search = query;
      if (ceremony && ceremony !== "All Ceremonies") params.ceremony = ceremony;
      if (religion) params.religion = religion;
      if (rating) {
        // Extract minimum rating number from strings like "4.5 & above"
        const minRating = parseFloat(rating);
        if (!isNaN(minRating)) params.minRating = minRating;
      }

      const response = await devoteeService.searchPriests(params);
      let foundPriests = response.priests || [];

      // Calculate distances if user location is available
      if (userCoords) {
        foundPriests = foundPriests.map((p: any) => {
          if (p.location?.coordinates) {
            const distance = calculateDistance(
              userCoords.latitude,
              userCoords.longitude,
              p.location.coordinates[1],
              p.location.coordinates[0]
            );
            return { ...p, distance };
          }
          return p;
        });
      }

      setPriests(foundPriests);
    } catch (err) {
      console.error("PriestSearchScreen: Error fetching priests:", err);
      setPriests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch priests immediately without waiting for location
    fetchPriests(initialSearchQuery, initialCeremony);

    // Get location in parallel (won't block priest list from loading)
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (err) {
        console.warn("Failed to get location:", err);
      }
    };
    getLocation();
  }, []);

  // When location becomes available, recalculate distances on already-loaded priests
  useEffect(() => {
    if (userCoords && priests.length > 0) {
      setPriests(prev => prev.map((p: any) => {
        if (p.location?.coordinates) {
          const distance = calculateDistance(
            userCoords.latitude,
            userCoords.longitude,
            p.location.coordinates[1],
            p.location.coordinates[0]
          );
          return { ...p, distance };
        }
        return p;
      }));
    }
  }, [userCoords]);

  // Handle search submission
  const handleSearch = () => {
    fetchPriests(searchQuery, selectedCeremony, selectedReligion, selectedRating);
  };

  // Handle ceremony selection and trigger search
  const handleCeremonySelect = (ceremony: string) => {
    const newCeremony = ceremony === selectedCeremony ? "" : ceremony;
    setSelectedCeremony(newCeremony);
    fetchPriests(searchQuery, newCeremony, selectedReligion, selectedRating);
  };

  const handlePriestPress = (priest: Priest) => {
    if (!priest._id) return;
    router.push({
      pathname: "/PriestDetails",
      params: { priestId: priest._id, ceremony: selectedCeremony },
    });
    // navigation.navigate('PriestDetails', { priestId: priest._id });
  };

  const handleBookPress = (priest: Priest) => {
    if (!priest._id) return;
    router.push({
      pathname: "/[BookCeremony]",
      params: { 
        BookCeremony: priest._id, 
        priestId: priest._id, 
        ceremony: selectedCeremony 
      },
    });
  };

  const renderPriestItem = ({ item }: { item: Priest }) => (
    <PujariCard
      pujari={item}
      ceremonyId={selectedCeremony}
      onBookPress={selectedCeremony ? () => handleBookPress(item) : undefined}
    />
  );

  // Debounced search function
  const debouncedSearch = React.useCallback(
    (query: string, ceremony: string) => {
      const timeoutId = setTimeout(() => {
        fetchPriests(query, ceremony);
      }, 500); // 500ms delay
      return () => clearTimeout(timeoutId);
    },
    []
  );

  // Keep track of timeout to clear it
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      fetchPriests(text, selectedCeremony, selectedReligion, selectedRating);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFE5D9', '#FFF5E6']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#704214" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Priests</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={24} color="#704214" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={APP_COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search priests by name"
            value={searchQuery}
            onChangeText={handleSearchTextChange}
          // Removed onSubmitEditing since we have live search
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery("");
                fetchPriests("", selectedCeremony);
              }}
            >
              <Ionicons name="close-circle" size={20} color={APP_COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Ceremonies</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {ceremonies.map((ceremony) => (
              <TouchableOpacity
                key={ceremony}
                style={[
                  styles.filterChip,
                  selectedCeremony === ceremony && styles.selectedFilterChip,
                ]}
                onPress={() => handleCeremonySelect(ceremony)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCeremony === ceremony &&
                    styles.selectedFilterChipText,
                  ]}
                >
                  {ceremony}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterRow}>
            <View style={styles.filterColumn}>
              <Text style={styles.filterTitle}>Religion</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {religions.map((religion) => (
                  <TouchableOpacity
                    key={religion}
                    style={[
                      styles.filterChip,
                      selectedReligion === religion &&
                      styles.selectedFilterChip,
                    ]}
                    onPress={() =>
                      setSelectedReligion(
                        religion === selectedReligion ? "" : religion
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedReligion === religion &&
                        styles.selectedFilterChipText,
                      ]}
                    >
                      {religion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterColumn}>
              <Text style={styles.filterTitle}>Rating</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {ratings.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.filterChip,
                      selectedRating === rating && styles.selectedFilterChip,
                    ]}
                    onPress={() =>
                      setSelectedRating(rating === selectedRating ? "" : rating)
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedRating === rating &&
                        styles.selectedFilterChipText,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCeremony("");
                setSelectedReligion("");
                setSelectedRating("");
                fetchPriests(searchQuery, "", "", "");
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setShowFilters(false);
                fetchPriests(searchQuery, selectedCeremony, selectedReligion, selectedRating);
              }}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {loading ? "Loading..." : `${priests.length} ${priests.length === 1 ? "priest" : "priests"} found`}
        </Text>

        {loading ? (
          <View style={{ paddingTop: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={[styles.priestCard, { opacity: 1 - i * 0.15 }]}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: APP_COLORS.lightGray }} />
                <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
                  <View style={{ width: 140, height: 16, borderRadius: 4, backgroundColor: APP_COLORS.lightGray, marginBottom: 8 }} />
                  <View style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: APP_COLORS.lightGray, marginBottom: 6 }} />
                  <View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: APP_COLORS.lightGray }} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={priests}
            renderItem={renderPriestItem}
            keyExtractor={(item) => `${item._id}`}
            contentContainerStyle={styles.priestsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={60} color={APP_COLORS.lightGray} />
                <Text style={styles.emptyText}>No priests found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search criteria
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#704214",
    fontFamily: "serif",
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: APP_COLORS.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.white,
    borderRadius: 20,
    padding: 12,
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: APP_COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#704214",
    fontFamily: "serif",
    marginBottom: 8,
  },
  filterScroll: {
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(112, 66, 20, 0.1)",
    shadowColor: "#704214",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedFilterChip: {
    backgroundColor: APP_COLORS.saffron,
    borderColor: APP_COLORS.saffron,
  },
  filterChipText: {
    fontSize: 13,
    color: "#704214",
  },
  selectedFilterChipText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  filterColumn: {
    flex: 1,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(112, 66, 20, 0.1)",
    paddingTop: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: APP_COLORS.white,
    borderWidth: 1,
    borderColor: "rgba(112, 66, 20, 0.2)",
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#704214",
  },
  applyFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: APP_COLORS.saffron,
  },
  applyFiltersText: {
    fontSize: 14,
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#704214",
    fontFamily: "serif",
    marginBottom: 16,
  },
  priestsList: {
    paddingBottom: 24,
  },
  priestCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    flexDirection: "row",
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: APP_COLORS.gray,
    textAlign: "center",
  },
});

export default PriestSearch;
