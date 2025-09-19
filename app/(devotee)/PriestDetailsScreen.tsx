// src/screens/devotee/PriestDetailsScreen.js
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_COLORS } from '../../constants/Colors';
import devoteeService from '../../services/devoteeService';

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
};

const PriestDetailsScreen: React.FC<{ navigation: any; route: { params: { priestId: string } } }> = ({ navigation, route }) => {
  const { priestId } = route.params;
  const [priest, setPriest] = useState<Priest | null>(null);
  const [selectedTab, setSelectedTab] = useState('about');
  const [isLoading, setIsLoading] = useState(true);

// Fetch priest data from API
  useEffect(() => {
    const fetchPriestDetails = async () => {
      try {
        const data = await devoteeService.getPriestDetails(priestId);
        setPriest(data);
      } catch (error) {
        console.error('Failed to fetch priest details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriestDetails();
  }, [priestId]);

  const handleBookNow = () => {
    if (!priest?.id) return;
    navigation.navigate('Booking', { priestId: priest.id });
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{item.user}</Text>
        <View style={styles.reviewRating}>
          {Array(5).fill(0).map((_, index) => (
            <Ionicons
              key={index}
              name={index < (item.rating || 0) ? 'star' : 'star-outline'}
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
      <View style={styles.loadingContainer}>
        <Text>Loading priest details...</Text>
      </View>
    );
  }

  if (!priest) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Priest details not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Priest Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={24} color={APP_COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.profileSection}>
          {priest.profilePicture ? (
            <Image source={{ uri: priest.profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={40} color="#ccc" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.priestName}>{priest.name || 'Unknown Priest'}</Text>
            <View style={styles.priestMeta}>
              <Text style={styles.priestDetail}>{priest.religiousTradition || 'Hinduism'}</Text>
              <Text style={styles.priestDetail}>{priest.experience || 0} years exp</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {priest.ratings?.average || 0} ({priest.ratings?.count || 0} reviews)
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusIndicator,
                priest.availability === 'available' ? styles.availableIndicator : styles.unavailableIndicator
              ]} />
              <Text style={[
                styles.statusText,
                priest.availability === 'available' ? styles.availableText : styles.unavailableText
              ]}>
                {priest.availability === 'available' ? 'Available Now' : 'Currently Busy'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'about' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab('about')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'about' && styles.activeTabButtonText,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'ceremonies' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab('ceremonies')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'ceremonies' && styles.activeTabButtonText,
              ]}
            >
              Ceremonies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'reviews' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab('reviews')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'reviews' && styles.activeTabButtonText,
              ]}
            >
              Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'availability' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab('availability')}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === 'availability' && styles.activeTabButtonText,
              ]}
            >
              Availability
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'about' && (
          <View style={styles.tabContent}>
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.aboutText}>{priest.description || priest.about || 'No description available'}</Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Temple Affiliation</Text>
              <View style={styles.affiliationContainer}>
                <Ionicons name="business-outline" size={20} color={APP_COLORS.gray} />
                <Text style={styles.affiliationText}>
{priest.templeAffiliation?.name || 'No temple'}, {priest.templeAffiliation?.address || 'No address'}
                </Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.languagesContainer}>
                {(priest.languages || []).map((language: string, index: number) => (
                  <View key={index} style={styles.languageBadge}>
                    <Text style={styles.languageText}>{language}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              {(priest.certifications || []).map((certification: string, index: number) => (
                <View key={index} style={styles.certificationRow}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={APP_COLORS.success} />
                  <Text style={styles.certificationText}>{certification}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'ceremonies' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Ceremonies & Pricing</Text>
            {(priest.ceremonies || []).map((ceremony: Ceremony, index: number) => (
              <View key={index} style={styles.ceremonyRow}>
                <Text style={styles.ceremonyName}>{ceremony.name}</Text>
                <Text style={styles.ceremonyPrice}>₹{ceremony.price}</Text>
              </View>
            ))}
            <Text style={styles.pricingNote}>
              * Additional charges may apply for travel beyond 15km and for ceremonies lasting more than 3 hours.
            </Text>
          </View>
        )}

        {selectedTab === 'reviews' && (
          <View style={styles.tabContent}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.overallRating}>
                  {priest.ratings?.average || 0} • {priest.ratings?.count || 0} reviews
                </Text>
              </View>
            </View>

            <FlatList
              data={priest.reviews || []}
              renderItem={renderReviewItem}
              keyExtractor={(item) => `${item.id}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {selectedTab === 'availability' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Weekly Availability</Text>
            {(Object.entries(priest.weeklyAvailability || {}) as [string, WeeklyAvailabilityEntry][]).map(([day, data]) => (
              <View key={day} style={styles.availabilityRow}>
                <Text style={styles.dayName}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                {data.available ? (
                  <View style={styles.timeRange}>
                    <Text style={styles.timeText}>{data.startTime} - {data.endTime}</Text>
                  </View>
                ) : (
                  <Text style={styles.unavailableDay}>Not Available</Text>
                )}
              </View>
            ))}
            <Text style={styles.availabilityNote}>
              * Priest may have limited availability on some days due to previously booked ceremonies.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>
            ₹{priest.ceremonies && priest.ceremonies.length > 0 ? Math.min(...priest.ceremonies.map(c => c.price || 0)) : 0}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bookButton,
            priest.availability !== 'available' && styles.disabledBookButton,
          ]}
          onPress={handleBookNow}
          disabled={priest.availability !== 'available'}
        >
          <Text style={styles.bookButtonText}>
            {priest.availability === 'available' ? 'Book Now' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: APP_COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: APP_COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priestMeta: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  priestDetail: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    backgroundColor: APP_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    minHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  affiliationText: {
    marginLeft: 8,
    fontSize: 14,
    color: APP_COLORS.black,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageBadge: {
    backgroundColor: APP_COLORS.primary + '20',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certificationText: {
    marginLeft: 8,
    fontSize: 14,
    color: APP_COLORS.black,
  },
  ceremonyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  ceremonyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ceremonyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
  },
  pricingNote: {
    fontSize: 12,
    color: APP_COLORS.gray,
    marginTop: 12,
    fontStyle: 'italic',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewRating: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeRange: {
    backgroundColor: APP_COLORS.primary + '20',
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
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: APP_COLORS.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.lightGray,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: APP_COLORS.gray,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
  },
});

export default PriestDetailsScreen;