import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { APP_COLORS } from "../../../constants/Colors";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";
import ceremonyService from "../../../services/ceremonyService";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator } from "react-native";
import { getImageUri } from "../../../utils/imageUtils";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SCREEN_WIDTH = Platform.OS === 'web' ? Math.min(WINDOW_WIDTH, 600) : WINDOW_WIDTH;
const SIDEBAR_WIDTH = 72; // Fixed width for sidebar instead of percentage

// ─── Component ────────────────────────────────────────────────────────────
const ExploreScreen: React.FC = () => {
    const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState(initialCategory || "all");

    // Sync activeCategory with param updates
    useEffect(() => {
        if (initialCategory) {
            setActiveCategory(initialCategory);
        }
    }, [initialCategory]);

    // Fetch Categories
    const { data: categories = [] } = useQuery({
        queryKey: ["ceremony-categories"],
        queryFn: ceremonyService.getCategories,
    });

    // Fetch Ceremonies (all initially, or by category)
    const { data: ceremoniesData, isLoading } = useQuery({
        queryKey: ["ceremonies", activeCategory],
        queryFn: () => activeCategory === "all" 
            ? ceremonyService.getAllPujas() 
            : ceremonyService.getPujasByCategory(activeCategory),
    });

    const ceremonies = ceremoniesData?.ceremonies || [];

    const searchedServices = searchQuery.trim()
        ? ceremonies.filter((s: any) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : ceremonies;

    const renderServiceCard = ({ item }: { item: any }) => (
        <Card style={styles.serviceCard}>
            <View style={styles.serviceRow}>
                <Image
                    source={{ 
                        uri: getImageUri(item.image || (item.images && item.images[0])) 
                    }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                />
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.serviceMetaRow}>
                        <Ionicons name="star" size={13} color="#FFD700" />
                        <Text style={styles.serviceRating}>{item.rating?.average?.toFixed(1) || "4.5"}</Text>
                        <Text style={styles.serviceBookings}>({item.bookingsCount || 0} booked)</Text>
                    </View>
                    <View style={styles.serviceMetaRow}>
                        <Ionicons name="time-outline" size={13} color={APP_COLORS.gray} />
                        <Text style={styles.serviceDuration}>
                            {typeof item.duration === 'object' ? (item.duration.typical || item.duration.minimum) : item.duration} mins
                        </Text>
                    </View>
                    <View style={styles.servicePriceRow}>
                        <Text style={styles.servicePrice}>₹{item.pricing?.basePrice || item.basePrice || "0"}</Text>
                        <PrimaryButton
                            title="Select"
                            onPress={() => router.push(`/(devoteeScreens)/(pujas)/${item._id}`)}
                            size="sm"
                            style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12 }}
                        />
                    </View>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* ── Search Bar ──────────────────────────────── */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={APP_COLORS.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for 'Griha Pravesh'..."
                        placeholderTextColor={APP_COLORS.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color={APP_COLORS.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Body: Sidebar + Main Content ──────────── */}
            <View style={styles.body}>
                {/* Sidebar */}
                <ScrollView
                    style={styles.sidebar}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 8 }}
                >
                    <TouchableOpacity
                        key="all-category"
                        style={[styles.sidebarItem, activeCategory === "all" && styles.sidebarItemActive]}
                        onPress={() => setActiveCategory("all")}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="apps"
                            size={20}
                            color={activeCategory === "all" ? APP_COLORS.saffron : APP_COLORS.gray}
                        />
                        <Text
                            style={[
                                styles.sidebarText,
                                activeCategory === "all" && styles.sidebarTextActive,
                            ]}
                            numberOfLines={1}
                        >
                            All
                        </Text>
                        {activeCategory === "all" && <View style={styles.sidebarIndicator} />}
                    </TouchableOpacity>

                    {categories.map((cat: any, index: number) => {
                        const categoryId = cat.slug || cat._id || cat.id || `cat-${index}`;
                        const isActive = activeCategory === categoryId;
                        return (
                            <TouchableOpacity
                                key={`category-${categoryId}-${index}`}
                                style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                                onPress={() => setActiveCategory(categoryId)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={(cat.icon || "flower") as any}
                                    size={20}
                                    color={isActive ? APP_COLORS.saffron : APP_COLORS.gray}
                                />
                                <Text
                                    style={[
                                        styles.sidebarText,
                                        isActive && styles.sidebarTextActive,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {cat.name}
                                </Text>
                                {isActive && <View style={styles.sidebarIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Main Content */}
                {isLoading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={APP_COLORS.saffron} />
                    </View>
                ) : (
                    <FlatList
                        data={searchedServices}
                        renderItem={renderServiceCard}
                        keyExtractor={(item, index) => item._id || item.id || index.toString()}
                        style={styles.mainContent}
                        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color={APP_COLORS.lightGray} />
                                <Text style={styles.emptyTitle}>No services found</Text>
                                <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
        width: Platform.OS === 'web' ? '100%' : undefined,
        maxWidth: Platform.OS === 'web' ? 600 : undefined,
        alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    },

    // Search
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: APP_COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.divider,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: APP_COLORS.background,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: APP_COLORS.bodyText,
    },

    // Body layout
    body: {
        flex: 1,
        flexDirection: "row",
    },

    // Sidebar
    sidebar: {
        width: 72,
        maxWidth: 72,
        flexShrink: 0,
        backgroundColor: APP_COLORS.surface,
        borderRightWidth: 1,
        borderRightColor: APP_COLORS.divider,
    },
    sidebarItem: {
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 4,
        position: "relative",
    },
    sidebarItemActive: {
        backgroundColor: APP_COLORS.saffronLight,
    },
    sidebarText: {
        fontSize: 10,
        color: APP_COLORS.gray,
        marginTop: 4,
        textAlign: "center",
        fontWeight: "500",
    },
    sidebarTextActive: {
        color: APP_COLORS.saffron,
        fontWeight: "700",
    },
    sidebarIndicator: {
        position: "absolute",
        left: 0,
        top: 10,
        bottom: 10,
        width: 3,
        backgroundColor: APP_COLORS.saffron,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },

    // Main content
    mainContent: {
        flex: 1,
    },

    // Service Card
    serviceCard: {
        marginBottom: 12,
        padding: 0,
        overflow: "hidden",
    },
    serviceRow: {
        flexDirection: "row",
    },
    serviceImage: {
        width: 100,
        height: 120,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    serviceInfo: {
        flex: 1,
        padding: 12,
        justifyContent: "space-between",
    },
    serviceName: {
        fontSize: 15,
        fontWeight: "700",
        color: APP_COLORS.headingText,
        marginBottom: 4,
    },
    serviceMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 2,
    },
    serviceRating: {
        fontSize: 12,
        fontWeight: "600",
        color: APP_COLORS.bodyText,
    },
    serviceBookings: {
        fontSize: 11,
        color: APP_COLORS.gray,
    },
    serviceDuration: {
        fontSize: 12,
        color: APP_COLORS.gray,
    },
    servicePriceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    servicePrice: {
        fontSize: 17,
        fontWeight: "800",
        color: APP_COLORS.headingText,
    },

    // Empty state
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: APP_COLORS.bodyText,
    },
    emptySubtitle: {
        fontSize: 13,
        color: APP_COLORS.gray,
    },
});

export default ExploreScreen;
