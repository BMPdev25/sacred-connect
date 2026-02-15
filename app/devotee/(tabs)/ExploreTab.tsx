import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { APP_COLORS } from "../../../constants/Colors";
import Card from "../../../components/Card";
import PrimaryButton from "../../../components/PrimaryButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.18;

// ─── Mock Data ────────────────────────────────────────────────────────────
const MOCK_CATEGORIES = [
    { id: "all", name: "All", icon: "apps" as const },
    { id: "weddings", name: "Weddings", icon: "heart" as const },
    { id: "birth", name: "Birth", icon: "happy" as const },
    { id: "death", name: "Ancestors", icon: "people" as const },
    { id: "festival", name: "Festivals", icon: "sparkles" as const },
    { id: "havan", name: "Havans", icon: "flame" as const },
    { id: "grihapravesh", name: "Griha Pravesh", icon: "home" as const },
    { id: "daily", name: "Daily Puja", icon: "sunny" as const },
];

const MOCK_SERVICES = [
    {
        id: "1",
        name: "Satyanarayan Puja",
        price: "₹2,100",
        duration: "45 mins",
        category: "festival",
        image: "https://images.unsplash.com/photo-1609234656388-0b5a1e3e8908?w=300",
        rating: 4.8,
        bookings: 234,
    },
    {
        id: "2",
        name: "Griha Pravesh Puja",
        price: "₹5,500",
        duration: "2 hrs",
        category: "grihapravesh",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300",
        rating: 4.9,
        bookings: 189,
    },
    {
        id: "3",
        name: "Ganesh Puja",
        price: "₹1,500",
        duration: "30 mins",
        category: "festival",
        image: "https://images.unsplash.com/photo-1567591370504-83a1d0a6a5fa?w=300",
        rating: 4.7,
        bookings: 312,
    },
    {
        id: "4",
        name: "Vivah Havan",
        price: "₹11,000",
        duration: "3 hrs",
        category: "weddings",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=300",
        rating: 4.9,
        bookings: 98,
    },
    {
        id: "5",
        name: "Namkaran Sanskar",
        price: "₹3,100",
        duration: "1 hr",
        category: "birth",
        image: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=300",
        rating: 4.6,
        bookings: 145,
    },
    {
        id: "6",
        name: "Shradh Puja",
        price: "₹2,500",
        duration: "1.5 hrs",
        category: "death",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        rating: 4.5,
        bookings: 67,
    },
    {
        id: "7",
        name: "Maha Mrityunjaya Havan",
        price: "₹4,200",
        duration: "2 hrs",
        category: "havan",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300",
        rating: 4.8,
        bookings: 201,
    },
    {
        id: "8",
        name: "Daily Puja Setup",
        price: "₹800",
        duration: "20 mins",
        category: "daily",
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=300",
        rating: 4.4,
        bookings: 456,
    },
];

// ─── Component ────────────────────────────────────────────────────────────
const ExploreScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const filteredServices =
        activeCategory === "all"
            ? MOCK_SERVICES
            : MOCK_SERVICES.filter((s) => s.category === activeCategory);

    const searchedServices = searchQuery.trim()
        ? filteredServices.filter((s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredServices;

    const renderServiceCard = ({ item }: { item: (typeof MOCK_SERVICES)[0] }) => (
        <Card style={styles.serviceCard}>
            <View style={styles.serviceRow}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                />
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.serviceMetaRow}>
                        <Ionicons name="star" size={13} color="#FFD700" />
                        <Text style={styles.serviceRating}>{item.rating}</Text>
                        <Text style={styles.serviceBookings}>({item.bookings} booked)</Text>
                    </View>
                    <View style={styles.serviceMetaRow}>
                        <Ionicons name="time-outline" size={13} color={APP_COLORS.gray} />
                        <Text style={styles.serviceDuration}>{item.duration}</Text>
                    </View>
                    <View style={styles.servicePriceRow}>
                        <Text style={styles.servicePrice}>{item.price}</Text>
                        <PrimaryButton
                            title="Select"
                            onPress={() => router.push("/(devoteeScreens)/(pujas)/AllPujas")}
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
                    {MOCK_CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                                onPress={() => setActiveCategory(cat.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={cat.icon as any}
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
                <FlatList
                    data={searchedServices}
                    renderItem={renderServiceCard}
                    keyExtractor={(item) => item.id}
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
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
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
