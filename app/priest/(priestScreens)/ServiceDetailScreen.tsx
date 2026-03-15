import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Platform, Modal
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../../../constants/Colors';
import priestService from '../../../services/priestService';

export default function ServiceDetailScreen() {
    const params = useLocalSearchParams();
    const serviceJson = typeof params.service === 'string' ? params.service : '{}';
    const initialService = React.useMemo(() => JSON.parse(serviceJson), [serviceJson]);

    // Form State
    const [price, setPrice] = useState(initialService.price?.toString() || '');
    const [requirements, setRequirements] = useState<string[]>(initialService.requirements || []);
    const [customRitualSteps, setCustomRitualSteps] = useState<any[]>(initialService.customSteps || []);
    const [newRequirement, setNewRequirement] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Modal State for custom ritual step
    const [showAddStepModal, setShowAddStepModal] = useState(false);
    const [newStepTitle, setNewStepTitle] = useState('');
    const [newStepDesc, setNewStepDesc] = useState('');
    const [newStepCharge, setNewStepCharge] = useState('');

    // Reset state when navigating to a different service
    useEffect(() => {
        setPrice(initialService.price?.toString() || '');
        setRequirements(initialService.requirements || []);
        setCustomRitualSteps(initialService.customSteps || []);
        setNewRequirement('');
        setHasChanges(false);
    }, [initialService]);

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

    const handleAddCustomStep = () => {
        if (!newStepTitle.trim() || !newStepDesc.trim()) {
            Alert.alert("Missing Information", "Please enter both title and description.");
            return;
        }
        const newStep = {
            title: newStepTitle.trim(),
            description: newStepDesc.trim(),
            additionalCharge: parseFloat(newStepCharge) || 0,
        };
        setCustomRitualSteps([...customRitualSteps, newStep]);
        setNewStepTitle('');
        setNewStepDesc('');
        setNewStepCharge('');
        setShowAddStepModal(false);
        setHasChanges(true);
    };

    const handleRemoveCustomStep = (index: number) => {
        const updated = [...customRitualSteps];
        updated.splice(index, 1);
        setCustomRitualSteps(updated);
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
            const getCeremonyId = (service: any) => {
                if (service.ceremonyId && typeof service.ceremonyId === 'object') {
                    return service.ceremonyId._id?.toString() || service.ceremonyId.toString();
                }
                return service.ceremonyId?.toString();
            };

            const targetCeremonyId = getCeremonyId(initialService);

            const updatedServices = services.map((s: any) => {
                const serviceCeremonyId = getCeremonyId(s);

                if (serviceCeremonyId === targetCeremonyId) {
                    return {
                        ...s,
                        price: parseFloat(price),
                        requirements: requirements,
                        customSteps: customRitualSteps
                    };
                }
                return s;
            });

            await priestService.updateProfile({ services: updatedServices });
            setHasChanges(false); 
            Alert.alert("Success", "Changes saved successfully!");
        } catch (error: any) {
            console.error("Update error:", error);
            Alert.alert("Error", error.message || "Failed to update service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraScrollHeight={200}
                extraHeight={150}
            >
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

                    {/* Ritual Steps - DEFAULT (Read-Only) */}
                    <View style={styles.divider} />
                    <Text style={styles.sectionHeader}>📋 What This Puja Includes</Text>
                    <Text style={styles.helperText}>Default steps defined for this ceremony (Read-only)</Text>
                    
                    <View style={styles.ritualStepsList}>
                        {ceremony.ritualSteps && ceremony.ritualSteps.length > 0 ? (
                            ceremony.ritualSteps.map((step: any, idx: number) => (
                                <View key={idx} style={styles.ritualStepItem}>
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepBadgeText}>{step.stepNumber}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.ritualStepTitle}>{step.title}</Text>
                                        <Text style={styles.ritualStepDesc}>{step.description}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.description}>No default ritual steps defined.</Text>
                        )}
                    </View>

                    {/* Custom Steps - EDITABLE */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>✨ Your Custom Inclusions</Text>
                        <TouchableOpacity style={styles.addStepIconBtn} onPress={() => setShowAddStepModal(true)}>
                            <Ionicons name="add-circle" size={28} color={APP_COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>Add your unique offerings or extra steps for this puja.</Text>

                    <View style={styles.customStepsList}>
                        {customRitualSteps.length > 0 ? (
                            customRitualSteps.map((step, idx) => (
                                <View key={idx} style={styles.customStepItem}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.ritualStepTitle}>{step.title}</Text>
                                            {step.additionalCharge > 0 && (
                                                <View style={styles.chargeBadge}>
                                                    <Text style={styles.chargeBadgeText}>+ ₹{step.additionalCharge}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.ritualStepDesc}>{step.description}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleRemoveCustomStep(idx)} style={{ padding: 8 }}>
                                        <Ionicons name="trash-outline" size={20} color={APP_COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <TouchableOpacity style={styles.emptyCustomStep} onPress={() => setShowAddStepModal(true)}>
                                <Ionicons name="sparkles-outline" size={24} color={APP_COLORS.primary} />
                                <Text style={styles.emptyCustomText}>Add your first custom service step</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Space & Participants Info */}
                    <Text style={styles.sectionHeader}>Logistics</Text>
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
                    <Text style={styles.sectionHeader}>Your Base Pricing</Text>
                    <Text style={styles.helperText}>Set your base price for this service. Custom additions can have separate charges.</Text>
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
                    <Text style={styles.sectionHeader}>Your Additional Item Requirements</Text>
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
            </KeyboardAwareScrollView>

            {/* Add Custom Step Modal */}
            <Modal
                visible={showAddStepModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddStepModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowAddStepModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Custom Step</Text>
                            <TouchableOpacity onPress={() => setShowAddStepModal(false)}>
                                <Ionicons name="close" size={24} color={APP_COLORS.black} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Step Title</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newStepTitle}
                            onChangeText={setNewStepTitle}
                            placeholder="e.g., Special Mahadeeparadhana"
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                            value={newStepDesc}
                            onChangeText={setNewStepDesc}
                            placeholder="Describe what this step includes..."
                            multiline
                        />

                        <Text style={styles.inputLabel}>Extra Charge (Optional)</Text>
                        <View style={styles.chargeInputContainer}>
                            <Text style={styles.currencyPrefix}>₹</Text>
                            <TextInput
                                style={styles.chargeInput}
                                value={newStepCharge}
                                onChangeText={setNewStepCharge}
                                placeholder="0"
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddCustomStep}>
                            <Text style={styles.modalAddBtnText}>Add to Ritual</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

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
    // Ritual Steps Styles
    ritualStepsList: {
        marginTop: 12,
        gap: 16,
    },
    ritualStepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: APP_COLORS.saffronLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: APP_COLORS.saffron,
    },
    ritualStepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: APP_COLORS.black,
        marginBottom: 4,
    },
    ritualStepDesc: {
        fontSize: 14,
        color: APP_COLORS.gray,
        lineHeight: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 8,
    },
    addStepIconBtn: {
        padding: 4,
    },
    customStepsList: {
        marginTop: 8,
        gap: 12,
    },
    customStepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDF7F0',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE8D1',
    },
    chargeBadge: {
        backgroundColor: APP_COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    chargeBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyCustomStep: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        gap: 10,
    },
    emptyCustomText: {
        fontSize: 14,
        color: APP_COLORS.gray,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: APP_COLORS.black,
        marginBottom: 8,
        marginTop: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    chargeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FAFAFA',
        height: 50,
    },
    currencyPrefix: {
        fontSize: 18,
        fontWeight: 'bold',
        color: APP_COLORS.gray,
        marginRight: 8,
    },
    chargeInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalAddBtn: {
        backgroundColor: APP_COLORS.primary,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    modalAddBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
