// src/screens/devotee/UniversalSearchScreen.js
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { APP_COLORS } from '../../constants/Colors';
import searchService from '../../services/searchService';

type PriestResult = {
  type: 'priest';
  id: string | number;
  profilePicture?: { url?: string } | string;
  name?: string;
  religiousTradition?: string;
  priceRange?: { min?: number; max?: number };
  rating?: { average?: number; count?: number };
  availability?: { status?: string };
};

type CeremonyResult = {
  type: 'ceremony';
  id: string | number;
  primaryImage?: { url?: string };
  name?: string;
  category?: string;
  description?: string;
  priceDisplay?: string;
  rating?: { average?: number; count?: number };
};

type SuggestionItem = PriestResult | CeremonyResult;

const UniversalSearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [query, setQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ priests: PriestResult[]; ceremonies: CeremonyResult[]; combined: SuggestionItem[] }>({
    priests: [],
    ceremonies: [],
    combined: [],
  });
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<'all' | 'priests' | 'ceremonies'>('all');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (query.length > 0) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const loadSuggestions = async () => {
    try {
      const response = await searchService.getSearchSuggestions(query, searchType);
      if (response.success) {
        setSuggestions(response.data.combined || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSearch = async () => {
    if (query.trim().length < 2) return;

    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      const response = await searchService.universalSearch(query, {
        type: searchType,
      });
      
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    setQuery(suggestion.name || '');
    setShowSuggestions(false);
    handleSearch();
  };

  const renderPriestItem = ({ item }: { item: PriestResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('PriestDetails', { priestId: item.id })}
    >
      <Image
        source={
          typeof item.profilePicture === 'string'
            ? { uri: item.profilePicture }
            : item.profilePicture?.url
            ? { uri: item.profilePicture.url }
            : require('../../assets/images/default-profile.png')
        }
        style={styles.priestImage}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.religiousTradition}</Text>
        <Text style={styles.itemPrice}>
          ₹{item.priceRange?.min || 0} - ₹{item.priceRange?.max || 0}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name={'star' as any} size={16} color={APP_COLORS.warning} />
          <Text style={styles.rating}>{(item.rating?.average || 0).toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({item.rating?.count || 0})</Text>
        </View>
      </View>
      <View style={styles.availabilityBadge}>
        <Text
          style={[
            styles.availabilityText,
            {
              color:
                item.availability?.status === 'available'
                  ? APP_COLORS.success
                  : APP_COLORS.warning,
            },
          ]}
        >
          {item.availability?.status || 'unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCeremonyItem = ({ item }: { item: CeremonyResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('CeremonyDetails', { ceremonyId: item.id })}
    >
      <Image
        source={
          item.primaryImage?.url
            ? { uri: item.primaryImage.url }
            : require('../../assets/images/home-rituals.jpg')
        }
        style={styles.ceremonyImage}
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.category}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.itemPrice}>{item.priceDisplay}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name={'star' as any} size={16} color={APP_COLORS.warning} />
          <Text style={styles.rating}>{(item.rating?.average || 0).toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({item.rating?.count || 0})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }: { item: SuggestionItem }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Ionicons
        name={(item.type === 'priest' ? 'person-outline' : 'star-outline') as any}
        size={20}
        color={APP_COLORS.gray}
      />
      <Text style={styles.suggestionText}>{item.name}</Text>
      <Text style={styles.suggestionType}>{item.type}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={APP_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={APP_COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search priests or ceremonies..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => {
              setQuery('');
              setSuggestions([]);
              setSearchResults({ priests: [], ceremonies: [], combined: [] });
            }}>
              <Ionicons name="close-circle" size={20} color={APP_COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Type Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, searchType === 'all' && styles.activeFilter]}
            onPress={() => setSearchType('all')}
          >
            <Text style={[styles.filterText, searchType === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, searchType === 'priests' && styles.activeFilter]}
            onPress={() => setSearchType('priests')}
          >
            <Text style={[styles.filterText, searchType === 'priests' && styles.activeFilterText]}>
              Priests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, searchType === 'ceremonies' && styles.activeFilter]}
            onPress={() => setSearchType('ceremonies')}
          >
            <Text style={[styles.filterText, searchType === 'ceremonies' && styles.activeFilterText]}>
              Ceremonies
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {showSuggestions && suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item, index) => `suggestion-${index}`}
          style={styles.suggestionsList}
        />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={
            searchType === 'all'
              ? searchResults.combined
              : searchType === 'priests'
              ? searchResults.priests
              : searchResults.ceremonies
          }
          renderItem={({ item }: { item: SuggestionItem }) => 
            item.type === 'priest' ? renderPriestItem({ item: item as PriestResult }) : renderCeremonyItem({ item: item as CeremonyResult })
          }
          keyExtractor={(item: SuggestionItem) => `${item.type}-${item.id}`}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            query.length > 0 && !isLoading && (
              <View style={styles.emptyContainer}>
                <Ionicons name={'search' as any} size={48} color={APP_COLORS.lightGray} />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with different keywords
                </Text>
              </View>
            )
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: APP_COLORS.text,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_COLORS.background,
    borderWidth: 1,
    borderColor: APP_COLORS.lightGray,
  },
  activeFilter: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  activeFilterText: {
    color: APP_COLORS.white,
    fontWeight: '600',
  },
  suggestionsList: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  suggestionType: {
    fontSize: 12,
    color: APP_COLORS.gray,
    textTransform: 'capitalize',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.lightGray,
  },
  priestImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  ceremonyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
  },
  ratingCount: {
    marginLeft: 4,
    fontSize: 14,
    color: APP_COLORS.gray,
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: APP_COLORS.background,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: APP_COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_COLORS.gray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: APP_COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default UniversalSearchScreen;
