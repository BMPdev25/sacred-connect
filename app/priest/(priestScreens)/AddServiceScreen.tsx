import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { APP_COLORS } from "../../../constants/Colors";
import ceremonyService from "../../../services/ceremonyService";
import priestService from "../../../services/priestService"; // Import priestService
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddServiceScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ceremonies, setCeremonies] = useState<any[]>([]);
    const [existingServiceIds, setExistingServiceIds] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [currentProfileServices, setCurrentProfileServices] = useState<any[]>([]); // Store full current services objects

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Fetch all available ceremonies
            const response = await ceremonyService.getAllPujas();
            const allCeremonies = response.ceremonies || [];

            // 2. Fetch current priest profile to know what they already have
            const profile = await priestService.getProfile();
            const myServices = profile.services || [];

            setCurrentProfileServices(myServices);

            // Create a Set of IDs for services the priest ALREADY has
            const existingIds = new Set(
                myServices.map((s: any) => s.ceremonyId?._id || s.ceremonyId)
            );
            setExistingServiceIds(existingIds);

            setCeremonies(allCeremonies);
        } catch (error) {
            console.error("Failed to load data", error);
            Alert.alert("Error", "Failed to load ceremonies.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (ceremonyId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(ceremonyId)) {
            newSelected.delete(ceremonyId);
        } else {
            newSelected.add(ceremonyId);
        }
        setSelectedIds(newSelected);
    };

    const handleSave = async () => {
        if (selectedIds.size === 0) {
            Alert.alert("No selection", "Please select at least one ceremony to add.");
            return;
        }

        try {
            setSaving(true);

            // 1. Construct new service objects
            // The backend likely expects objects like { ceremonyId: "...", price: 0, requirements: [] }
            const newServicesToAdd = Array.from(selectedIds).map(id => ({
                ceremonyId: id,
                price: 0, // Default price, they can edit later
                isActive: true,
                requirements: [] // Default empty
            }));

            // 2. Combine with existing services
            // We must send the FULL list because the backend replaces the array
            // Ensure we format currentProfileServices correctly if they came populated
            const formattedExistingServices = currentProfileServices.map(s => ({
                ceremonyId: s.ceremonyId._id || s.ceremonyId, // Handle populated vs unpopulated
                price: s.price,
                isActive: s.isActive,
                requirements: s.requirements
            }));

            const combinedServices = [...formattedExistingServices, ...newServicesToAdd];

            // 3. Update profile
            await priestService.updateProfile({ services: combinedServices });
            router.push("/priest/(tabs)/ServicesTab");
        } catch (error) {
            console.error("Failed to add services", error);
            Alert.alert("Error", "Failed to save services. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const filteredCeremonies = ceremonies.filter((c) => {
        // Exclude already existing services
        if (existingServiceIds.has(c._id)) return false;

        // Apply search filter
        return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderItem = ({ item }: { item: any }) => {
        const isSelected = selectedIds.has(item._id);
        return (
            <TouchableOpacity
                style={[styles.card, isSelected && styles.selectedCard]}
                onPress={() => toggleSelection(item._id)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{item.name}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={APP_COLORS.primary} />}
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.p16}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search ceremonies..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={APP_COLORS.gray}
                />
            </View>

            <FlatList
                data={filteredCeremonies}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {searchQuery ? "No matching ceremonies found." : "No new ceremonies available to add."}
                    </Text>
                }
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, (selectedIds.size === 0 || saving) && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={selectedIds.size === 0 || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveText}>Add {selectedIds.size} Services</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: APP_COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: APP_COLORS.lightGray,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    p16: {
        padding: 16,
        backgroundColor: APP_COLORS.white,
    },
    searchBar: {
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 16,
        height: 44,
        fontSize: 16,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: APP_COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedCard: {
        borderColor: APP_COLORS.primary,
        backgroundColor: '#FFF5E6', // Light orange tint
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: APP_COLORS.black,
    },
    selectedText: {
        color: APP_COLORS.primary,
        fontWeight: 'bold',
    },
    cardDesc: {
        fontSize: 14,
        color: APP_COLORS.gray,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: APP_COLORS.gray,
        fontSize: 16,
    },
    footer: {
        padding: 16,
        backgroundColor: APP_COLORS.white,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.lightGray,
    },
    saveButton: {
        backgroundColor: APP_COLORS.primary,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    saveText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
