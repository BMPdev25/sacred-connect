import React from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
import { APP_COLORS } from "../../../constants/Colors";
import ceremonyService from "../../../services/ceremonyService";
import { getImageUri } from "../../../utils/imageUtils";
import { Ionicons } from "@expo/vector-icons";

export default function AllPujasScreen() {
    const router = useRouter();

    const { data, isLoading, error } = useQuery({
        queryKey: ["ceremonies", "all"],
        queryFn: () => ceremonyService.getAllPujas({ limit: 50 }), // Fetch more for the list
    });

    const [searchQuery, setSearchQuery] = React.useState("");

    const pujas = data?.ceremonies || [];
    const filteredPujas = React.useMemo(() => {
        if (!searchQuery) return pujas;
        return pujas.filter((p: any) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [pujas, searchQuery]);

    const handlePujaPress = (pujaId: string) => {
        router.push(`/(devoteeScreens)/(pujas)/${pujaId}`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handlePujaPress(item._id)}
        >
            <Image
                source={{ uri: getImageUri(item.image) }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>₹{item.pricing?.basePrice}</Text>
                </View>
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={APP_COLORS.gray} />
                        <Text style={styles.metaText}>{item.duration?.typical} mins</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Failed to load ceremonies.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "All Ceremonies",
                    headerTintColor: APP_COLORS.white,
                    headerStyle: { backgroundColor: APP_COLORS.primary },
                    headerShadowVisible: false,
                }}
            />
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={APP_COLORS.gray} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search ceremonies..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={APP_COLORS.gray}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color={APP_COLORS.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <FlatList
                data={filteredPujas}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No ceremonies found.</Text>
                }
            />
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
    },
    listContent: {
        padding: 16,
    },
    searchContainer: {
        backgroundColor: APP_COLORS.primary,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: APP_COLORS.white,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: APP_COLORS.black,
    },
    card: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: "100%",
        height: 150,
    },
    content: {
        padding: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: APP_COLORS.black,
        flex: 1,
    },
    price: {
        fontSize: 16,
        fontWeight: '600',
        color: APP_COLORS.primary
    },
    description: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12
    },
    metaText: {
        fontSize: 12,
        color: APP_COLORS.gray,
        marginLeft: 4
    },
    errorText: {
        color: APP_COLORS.error,
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: APP_COLORS.gray,
        fontStyle: 'italic'
    }
});
