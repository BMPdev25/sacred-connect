import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../../constants/Colors';
import priestService from '../../../services/priestService';

export default function ServiceDetailScreen() {
    const params = useLocalSearchParams();
    const serviceJson = typeof params.service === 'string' ? params.service : '{}';
    const initialService = JSON.parse(serviceJson);

    // Form State
    const [price, setPrice] = useState(initialService.price?.toString() || '');
    const [requirements, setRequirements] = useState<string[]>(initialService.requirements || []);
    const [newRequirement, setNewRequirement] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Ceremony Details (read-only from ceremonyId)
    const ceremony = initialService.ceremonyId || {};
    const imageUri = ceremony.images?.[0]?.url || 'https://via.placeholder.com/400x200';

    const handleAddRequirement = () => {
        if (!newRequirement.trim()) return;
        setRequirements([...requirements, newRequirement.trim()]);
        setNewRequirement('');
        setHasChanges(true);
    };

    const handleRemoveRequirement = (index: number) => {
        const updated = [...requirements];
        updated.splice(index, 1);
        setRequirements(updated);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!price || isNaN(parseFloat(price))) {
            Alert.alert("Invalid Input", "Please enter a valid price");
            return;
        }

        try {
            setLoading(true);
            const profile = await priestService.getProfile();
            const services = profile.services || [];

            // Find and update the specific service
            // We match by _id or ceremonyId._id if _id is missing on local copy
            const updatedServices = services.map((s: any) => {
                const sId = s._id || s.ceremonyId?._id;
                const targetId = initialService._id || initialService.ceremonyId?._id;

                if (sId === targetId) {
                    return {
                        ...s,
                        price: parseFloat(price),
                        requirements: requirements
                    };
                }
                return s;
            });

            await priestService.updateProfile({ services: updatedServices });
            router.push("/priest/(tabs)/ServicesTab");
        } catch (error: any) {
            console.error("Update error:", error);
            Alert.alert("Error", error.message || "Failed to update service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Image - Taller & Clean */}
                <Image
                    source={{ uri: imageUri }}
                    style={styles.headerImage}
                    resizeMode="cover"
                />

                <TouchableOpacity style={styles.backButton} onPress={() => router.push("/priest/(tabs)/ServicesTab")}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                {/* Overlapping Content Container */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{ceremony.name || "Service Details"}</Text>

                    <View style={styles.metaRow}>
                        <Ionicons name="time-outline" size={16} color={APP_COLORS.gray} />
                        <Text style={styles.metaText}>{ceremony.durationMinutes || 60} mins (approx)</Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.sectionHeader}>About this Puja</Text>
                    <Text style={styles.description}>
                        {ceremony.description || "No description available for this ceremony."}
                    </Text>

                    {/* Space & Participants Info */}
                    <View style={styles.infoCard}>
                        {ceremony.requirements?.spaceRequirements && (
                            <View style={styles.infoRow}>
                                <Ionicons name="home-outline" size={20} color={APP_COLORS.primary} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoTitle}>House Requirements</Text>
                                    <Text style={styles.infoValue}>{ceremony.requirements.spaceRequirements}</Text>
                                </View>
                            </View>
                        )}

                        {ceremony.requirements?.participants && (
                            <View style={[styles.infoRow, { marginTop: 12 }]}>
                                <Ionicons name="people-outline" size={20} color={APP_COLORS.primary} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoTitle}>Participants</Text>
                                    <Text style={styles.infoValue}>
                                        Min: {ceremony.requirements.participants.required || 1}
                                        {ceremony.requirements.participants.maximum ? ` - Max: ${ceremony.requirements.participants.maximum}` : ''}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Pricing Edit */}
                    <Text style={styles.sectionHeader}>Your Pricing</Text>
                    <Text style={styles.helperText}>Set your base price for this service.</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.priceInput}
                            value={price}
                            onChangeText={(text) => {
                                setPrice(text);
                                setHasChanges(true);
                            }}
                            keyboardType="numeric"
                            placeholder="Enter Price"
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Standard Requirements (Read-Only) */}
                    <Text style={styles.sectionHeader}>Standard Items Required</Text>
                    <Text style={styles.helperText}>These are the standard items defined for this ceremony.</Text>

                    <View style={styles.stdReqList}>
                        {ceremony.requirements?.materials && ceremony.requirements.materials.length > 0 ? (
                            ceremony.requirements.materials.map((req: any, index: number) => (
                                <View key={index} style={styles.stdReqItem}>
                                    <Ionicons name="ellipse" size={8} color={APP_COLORS.gray} style={{ marginTop: 6 }} />
                                    <Text style={styles.stdReqText}>
                                        {typeof req === "string" ? req : `${req.quantity || ""} ${req.name}`}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.description}>No standard items listed.</Text>
                        )}
                    </View>

                    {/* Requirements Edit */}
                    <Text style={styles.sectionHeader}>Your Additional Requirements</Text>
                    <Text style={styles.helperText}>Add any extra items you need the devotee to arrange.</Text>

                    <View style={styles.addReqRow}>
                        <TextInput
                            style={styles.reqInput}
                            value={newRequirement}
                            onChangeText={setNewRequirement}
                            placeholder="e.g. 2kg Rice"
                            onSubmitEditing={handleAddRequirement}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddRequirement}>
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.reqList}>
                        {requirements.map((req, index) => (
                            <View key={index} style={styles.reqItem}>
                                <Ionicons name="checkmark-circle-outline" size={20} color={APP_COLORS.primary} />
                                <Text style={styles.reqText}>{req}</Text>
                                <TouchableOpacity onPress={() => handleRemoveRequirement(index)}>
                                    <Ionicons name="close-circle" size={20} color={APP_COLORS.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Save Bar - only show when there are changes */}
            {hasChanges && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.disabledBtn]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    headerImage: {
        width: '100%',
        height: 300,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
        zIndex: 10,
    },
    detailsContainer: {
        flex: 1,
        backgroundColor: APP_COLORS.white, // Or background if off-white
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: APP_COLORS.black,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    metaText: {
        marginLeft: 6,
        color: APP_COLORS.gray,
        fontSize: 14,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: APP_COLORS.black,
        marginTop: 16,
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: APP_COLORS.gray,
        lineHeight: 24,
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: APP_COLORS.black,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: APP_COLORS.gray,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: APP_COLORS.lightGray,
        marginVertical: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8F9FA',
        height: 56,
        marginTop: 8,
    },
    currency: {
        fontSize: 20,
        fontWeight: 'bold',
        color: APP_COLORS.gray,
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    helperText: {
        fontSize: 13,
        color: APP_COLORS.gray,
        marginBottom: 12,
    },
    stdReqList: {
        marginBottom: 24,
        gap: 8,
    },
    stdReqItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 8,
    },
    stdReqText: {
        flex: 1,
        fontSize: 15,
        color: APP_COLORS.gray,
        marginLeft: 10,
        lineHeight: 22,
    },
    addReqRow: {
        flexDirection: 'row',
        marginBottom: 16,
        marginTop: 8,
    },
    reqInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8F9FA',
        height: 48,
        marginRight: 10,
    },
    addBtn: {
        backgroundColor: APP_COLORS.primary,
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reqList: {
        gap: 10,
    },
    reqItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    reqText: {
        flex: 1,
        fontSize: 15,
        color: APP_COLORS.black,
        marginLeft: 10,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    saveButton: {
        backgroundColor: APP_COLORS.primary,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: APP_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    disabledBtn: {
        opacity: 0.7,
        shadowOpacity: 0,
    },
    saveText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
