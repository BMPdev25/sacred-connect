import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Switch, TextInput, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_COLORS } from '../../../constants/Colors';
import priestService from '../../../services/priestService';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Memoized service card to prevent unnecessary re-renders in FlatList
const ServiceCard = memo(({ item, index, onToggleActive }: {
    item: any;
    index: number;
    onToggleActive: (index: number, currentValue: boolean) => void;
}) => {
    const imageUri = item.ceremonyId?.images?.[0]?.url
        ? (item.ceremonyId.images[0].url.startsWith('http')
            ? item.ceremonyId.images[0].url
            : `${process.env.EXPO_PUBLIC_API_URL}${item.ceremonyId.images[0].url}`)
        : 'https://via.placeholder.com/400x200';

    const navigateToDetail = () => {
        router.push({
            pathname: "/priest/(priestScreens)/ServiceDetailScreen",
            params: { service: JSON.stringify(item) }
        });
    };

    return (
        <TouchableOpacity
            style={[styles.card, !item.isActive && styles.inactiveCard]}
            onPress={navigateToDetail}
            activeOpacity={0.9}
        >
            <ImageBackground
                source={{ uri: imageUri }}
                style={styles.cardBackground}
                imageStyle={styles.cardImage}
            >
                <View style={styles.cardOverlay}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.serviceName, !item.isActive && styles.inactiveText]}>
                                {item.ceremonyId?.name || item.name || "Unknown Service"}
                            </Text>
                            <Switch
                                trackColor={{ false: "#767577", true: APP_COLORS.primary }}
                                thumbColor={APP_COLORS.white}
                                onValueChange={() => onToggleActive(index, item.isActive)}
                                value={item.isActive}
                            />
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.priceTag}>
                            <Text style={styles.priceLabel}>Base Price</Text>
                            <Text style={styles.priceValue}>₹{item.price}</Text>
                        </View>

                        <View style={styles.detailButton}>
                            <Text style={styles.detailButtonText}>Details</Text>
                            <Ionicons name="arrow-forward" size={16} color={APP_COLORS.white} />
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
});

const EmptyList = memo(() => (
    <View style={styles.empty}>
        <Text style={styles.emptyText}>No services offered yet.</Text>
    </View>
));

export default function ServicesTab() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const profile = await priestService.getProfile();
            const serviceList = (profile.services || []).map((s: any) => ({
                ...s,
                isActive: s.isActive !== undefined ? s.isActive : true
            }));
            setServices(serviceList);
        } catch (error) {
            console.error('Error fetching services:', error);
            Alert.alert("Error", "Failed to load services");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [fetchServices])
    );

    const handleToggleActive = useCallback(async (index: number, currentValue: boolean) => {
        setServices(prev => {
            const newServices = [...prev];
            newServices[index] = { ...newServices[index], isActive: !currentValue };
            // Fire and forget the API call
            priestService.updateProfile({ services: newServices }).catch((error) => {
                console.error("Error updating service status", error);
                Alert.alert("Error", "Failed to update status");
                // Revert
                setServices(old => {
                    const reverted = [...old];
                    reverted[index] = { ...reverted[index], isActive: currentValue };
                    return reverted;
                });
            });
            return newServices;
        });
    }, []);

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
        <ServiceCard item={item} index={index} onToggleActive={handleToggleActive} />
    ), [handleToggleActive]);

    const keyExtractor = useCallback((item: any, index: number) => item._id || index.toString(), []);

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={APP_COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={EmptyList}
                    removeClippedSubviews
                    maxToRenderPerBatch={5}
                    windowSize={5}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push("/priest/(priestScreens)/AddServiceScreen")}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={30} color={APP_COLORS.white} />
                <Text style={styles.fabText}>Add New</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.neutral,
    },
    header: {
        // Removed custom header
    },
    title: {
        // Removed custom title
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Space for FAB
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: APP_COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: APP_COLORS.divider,
        height: 180,
        overflow: 'hidden',
        backgroundColor: APP_COLORS.white,
    },
    inactiveCard: {
        opacity: 0.8,
    },
    cardBackground: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    cardImage: {
        borderRadius: 16,
    },
    cardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for readability
        padding: 16,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    serviceName: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'serif',
        color: APP_COLORS.white,
        flex: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        marginRight: 10,
    },
    inactiveText: {
        color: '#ddd',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceLabel: {
        fontSize: 10,
        color: '#eee',
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.white,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D98934',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    detailButtonText: {
        color: APP_COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 4,
    },
    empty: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: APP_COLORS.gray,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#D98934',
        borderRadius: 100, // Pill shape or circle
        height: 56,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: APP_COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    fabText: {
        color: APP_COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    }
});
