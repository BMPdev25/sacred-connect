import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { APP_COLORS } from "../../../constants/Colors";
import devoteeService from "../../../services/devoteeService";


type Priest = {
  _id?: string;
  profilePicture?: string;
  name?: string;
  religiousTradition?: string;
  experience?: number;
  ratings?: { average?: number; count?: number };
  ceremonies?: string[];
};

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
    "Grih Pravesh",
    "Baby Naming",
    "Satyanarayan Katha",
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

  useEffect(() => {
    const fetchPriests = async () => {
      try {
        setLoading(true);
        // console.log('PriestSearchScreen: Fetching priests...');

        // Try debug endpoint first
        // const allPriestsResponse = await devoteeService.getAllPriests();
        // console.log('PriestSearchScreen: All priests response:', allPriestsResponse);

        const response = await devoteeService.searchPriests({ limit: 50 });
        // console.log('PriestSearchScreen: Search priests response:', response);
        setPriests(response.priests || []);
      } catch (err) {
        console.error("PriestSearchScreen: Error fetching priests:", err);
        setPriests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPriests();
  }, []);

  // Filter priests based on search criteria
  const filteredPriests = priests.filter((priest: Priest) => {
    // Filter by search query
    if (
      searchQuery &&
      !(priest.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by ceremony
    if (selectedCeremony && selectedCeremony !== "All Ceremonies") {
      if (!priest.ceremonies?.includes(selectedCeremony)) {
        return false;
      }
    }

    // Filter by religion
    if (selectedReligion && priest.religiousTradition !== selectedReligion) {
      return false;
    }

    // Filter by rating
    if (selectedRating) {
      let minRating = 0;
      if (selectedRating === "4.5 & above") minRating = 4.5;
      else if (selectedRating === "4.0 & above") minRating = 4.0;
      else if (selectedRating === "3.5 & above") minRating = 3.5;

      if ((priest.ratings?.average || 0) < minRating) {
        return false;
      }
    }

    return true;
  });

  const handleSearch = () => {
    // Implement search logic if needed
  };

  const handleCeremonySelect = (ceremony: string) => {
    setSelectedCeremony(ceremony === selectedCeremony ? "" : ceremony);
  };

  const handlePriestPress = (priest: Priest) => {
    if (!priest._id) return;
    router.push({
      pathname: "/PriestDetails",
      params: { priestId: priest._id },
    });
    // navigation.navigate('PriestDetails', { priestId: priest._id });
  };

  const renderPriestItem = ({ item }: { item: Priest }) => (
    <TouchableOpacity
      style={styles.priestCard}
      onPress={() => handlePriestPress(item)}
    >
      <Image
        source={
          item.profilePicture
            ? { uri: item.profilePicture }
            : require("../../../assets/images/pandit1.jpg")
        }
        style={styles.priestImage}
      />
      <View style={styles.priestInfo}>
        <Text style={styles.priestName}>{item.name}</Text>
        <View style={styles.priestMeta}>
          <Text style={styles.priestDetail}>{item.religiousTradition}</Text>
          <Text style={styles.priestDetail}>{item.experience} yrs exp</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.ratings?.average || 0} ({item.ratings?.count || 0})
          </Text>
        </View>
        <View style={styles.specialtiesContainer}>
          {item.ceremonies
            ?.slice(0, 2)
            .map((ceremony: string, index: number) => (
              <View key={index} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>{ceremony}</Text>
              </View>
            ))}
          {(item.ceremonies?.length || 0) > 2 && (
            <View style={styles.specialtyBadge}>
              <Text style={styles.specialtyText}>
                +{(item.ceremonies?.length || 0) - 2} more
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.priestStatus}>
        <View style={[styles.statusIndicator, styles.availableIndicator]} />
        <Text style={[styles.statusText, styles.availableText]}>Available</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push({pathname: "/[BookCeremony]", params: { BookCeremony: item._id ?? "", priestId: item._id ?? "" } })}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Priests</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options-outline" size={24} color={APP_COLORS.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={APP_COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search priests by name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
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
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredPriests.length}{" "}
          {filteredPriests.length === 1 ? "priest" : "priests"} found
        </Text>

        <FlatList
          data={filteredPriests}
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
    backgroundColor: APP_COLORS.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: APP_COLORS.background,
    borderRadius: 8,
    padding: 12,
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
    backgroundColor: APP_COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  filterScroll: {
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  selectedFilterChip: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: APP_COLORS.black,
  },
  selectedFilterChipText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  filterColumn: {
    flex: 1,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
    paddingTop: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.gray,
  },
  clearFiltersText: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  applyFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: APP_COLORS.primary,
  },
  applyFiltersText: {
    fontSize: 14,
    color: APP_COLORS.white,
    fontWeight: "bold",
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  priestsList: {
    paddingBottom: 16,
  },
  priestCard: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    flexDirection: "row",
    elevation: 2,
  },
  priestImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  priestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  priestName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  priestMeta: {
    flexDirection: "row",
    marginBottom: 4,
  },
  priestDetail: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: APP_COLORS.black,
    marginLeft: 4,
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  specialtyBadge: {
    backgroundColor: APP_COLORS.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: APP_COLORS.primary,
  },
  priestStatus: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  availableIndicator: {
    backgroundColor: APP_COLORS.success,
  },
  unavailableIndicator: {
    backgroundColor: APP_COLORS.error,
  },
  statusText: {
    fontSize: 12,
    marginBottom: 8,
  },
  availableText: {
    color: APP_COLORS.success,
  },
  unavailableText: {
    color: APP_COLORS.error,
  },
  bookButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: APP_COLORS.primary,
  },
  bookButtonText: {
    color: APP_COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
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
