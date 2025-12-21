import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { APP_COLORS } from '../../constants/Colors';
import devoteeService from '../../services/devoteeService';
import ceremonyService from '../../services/ceremonyService';

export default function GlobalSearchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const initialQuery = typeof params.query === 'string' ? params.query : '';

    const [query, setQuery] = useState(initialQuery);
    const [priests, setPriests] = useState<any[]>([]);
    const [ceremonies, setCeremonies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounced search
    const debouncedSearch = useCallback((text: string) => {
        setLoading(true);
        const timeoutId = setTimeout(async () => {
            if (!text.trim()) {
                setPriests([]);
                setCeremonies([]);
                setLoading(false);
                return;
            }

            try {
                const [priestRes, ceremonyRes] = await Promise.all([
                    devoteeService.searchPriests({ search: text, limit: 10 }),
                    ceremonyService.getAllPujas({ limit: 50 }) // Using fetch all and filter as temp solution if searchPujas not ready
                    // Or use ceremonyService.searchPujas(text) if backend supports it
                ]);

                // Filter ceremonies locally for now if search API isn't robust
                const allCeremonies = ceremonyRes.ceremonies || [];
                const filteredCeremonies = allCeremonies.filter((c: any) =>
                    c.name.toLowerCase().includes(text.toLowerCase()) ||
                    c.description?.toLowerCase().includes(text.toLowerCase())
                );

                setPriests(priestRes.priests || []);
                setCeremonies(filteredCeremonies);
            } catch (err) {
                console.error("Global search error:", err);
            } finally {
                setLoading(false);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, []);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTextChange = (text: string) => {
        setQuery(text);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            if (!text.trim()) {
                setPriests([]);
                setCeremonies([]);
                setLoading(false);
                return;
            }

            try {
                // Parallel fetch
                const [priestRes, ceremonyRes] = await Promise.all([
                    devoteeService.searchPriests({ search: text, limit: 5 }),
                    // Using getAllPujas and filtering client side for now as we know it works
                    ceremonyService.getAllPujas({ limit: 100 })
                ]);

                const allCeremonies = ceremonyRes.ceremonies || [];
                const filteredCeremonies = allCeremonies.filter((c: any) =>
                    c.name.toLowerCase().includes(text.toLowerCase())
                );

                setPriests(priestRes.priests || []);
                setCeremonies(filteredCeremonies);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 500);
    };

    useEffect(() => {
        if (initialQuery) {
            handleTextChange(initialQuery);
        }
    }, []);

    const renderCeremonyItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => router.push(`/(devoteeScreens)/(pujas)/${item._id}`)}
        >
            <Image source={{ uri: item.image || "https://via.placeholder.com/100" }} style={styles.resultImage} />
            <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.gray} />
        </TouchableOpacity>
    );

    const renderPriestItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.resultCard}
            onPress={() => router.push({ pathname: "/PriestDetails", params: { priestId: item._id } })}
        >
            <Image
                source={item.profilePicture ? { uri: item.profilePicture } : require("../../assets/images/pandit1.jpg")}
                style={styles.resultImage}
            />
            <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <Text style={styles.resultSubtitle}>{item.religiousTradition} • {item.experience} yrs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={APP_COLORS.gray} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={APP_COLORS.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search priests, ceremonies..."
                        value={query}
                        onChangeText={handleTextChange}
                        autoFocus={true}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleTextChange("")}>
                            <Ionicons name="close-circle" size={20} color={APP_COLORS.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={APP_COLORS.primary} />
                </View>
            ) : (
                <ScrollView style={styles.resultsContainer}>
                    {ceremonies.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Ceremonies ({ceremonies.length})</Text>
                            <FlatList
                                data={ceremonies}
                                renderItem={renderCeremonyItem}
                                keyExtractor={item => item._id}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {priests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Priests ({priests.length})</Text>
                            <FlatList
                                data={priests}
                                renderItem={renderPriestItem}
                                keyExtractor={item => item._id}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {query.length > 0 && ceremonies.length === 0 && priests.length === 0 && (
                        <View style={styles.centerContainer}>
                            <Text style={styles.noResultsText}>No results found for "{query}"</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: APP_COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
    },
    backButton: {
        marginRight: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: APP_COLORS.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
    },
    resultsContainer: {
        flex: 1,
    },
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
        marginBottom: 8,
        color: APP_COLORS.black,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: APP_COLORS.white,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 10,
        elevation: 1,
    },
    resultImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: APP_COLORS.lightGray,
    },
    resultContent: {
        flex: 1,
        marginLeft: 12,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: APP_COLORS.black,
    },
    resultSubtitle: {
        fontSize: 14,
        color: APP_COLORS.gray,
    },
    noResultsText: {
        fontSize: 16,
        color: APP_COLORS.gray,
        fontStyle: 'italic',
    }
});
