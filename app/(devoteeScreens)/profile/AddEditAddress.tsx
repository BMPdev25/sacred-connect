import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS } from '../../../constants/Colors';
import devoteeService from '../../../services/devoteeService';
import { Ionicons } from '@expo/vector-icons';

export default function AddEditAddressScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const isEdit = !!params.address;
    const initialAddress = isEdit ? JSON.parse(params.address as string) : {};
    const insets = useSafeAreaInsets();

    const [form, setForm] = useState({
        street: initialAddress.street || '',
        area: initialAddress.area || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        zip: initialAddress.zip || '',
        landmark: initialAddress.landmark || '',
        type: initialAddress.type || 'Home',
        isDefault: initialAddress.isDefault || false,
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!form.street || !form.area || !form.city || !form.zip) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await devoteeService.updateAddress(initialAddress._id, form);
            } else {
                await devoteeService.addAddress(form);
            }
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    const renderTypeButton = (type: string, icon: any) => (
        <TouchableOpacity
            style={[styles.typeButton, form.type === type && styles.typeButtonSelected]}
            onPress={() => setForm({ ...form, type })}
        >
            <Ionicons name={icon} size={20} color={form.type === type ? APP_COLORS.primary : APP_COLORS.gray} />
            <Text style={[styles.typeButtonText, form.type === type && styles.typeButtonTextSelected]}>{type}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <Stack.Screen options={{ title: isEdit ? 'Edit Address' : 'Add Address' }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.label}>Save as</Text>
                    <View style={styles.typeContainer}>
                        {renderTypeButton('Home', 'home')}
                        {renderTypeButton('Work', 'briefcase')}
                        {renderTypeButton('Other', 'location')}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Flat / House No / Floor *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.street}
                        onChangeText={(t) => setForm({ ...form, street: t })}
                        placeholder="Ex: Flat 402, Lotus Appts"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Area / Sector / Locality *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.area}
                        onChangeText={(t) => setForm({ ...form, area: t })}
                        placeholder="Ex: HSR Layout, Sector 4"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Landmark (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.landmark}
                        onChangeText={(t) => setForm({ ...form, landmark: t })}
                        placeholder="Ex: Near BDA Complex"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>City *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.city}
                            onChangeText={(t) => setForm({ ...form, city: t })}
                            placeholder="Ex: Bengaluru"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Pincode *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.zip}
                            onChangeText={(t) => setForm({ ...form, zip: t })}
                            placeholder="Ex: 560102"
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                        style={styles.input}
                        value={form.state}
                        onChangeText={(t) => setForm({ ...form, state: t })}
                        placeholder="Ex: Karnataka"
                    />
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Make this my default address</Text>
                    <Switch
                        value={form.isDefault}
                        onValueChange={(v) => setForm({ ...form, isDefault: v })}
                        trackColor={{ false: APP_COLORS.lightGray, true: APP_COLORS.primary + '80' }}
                        thumbColor={form.isDefault ? APP_COLORS.primary : APP_COLORS.gray}
                    />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>{loading ? 'SAVING...' : 'SAVE ADDRESS'}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginBottom: 8,
        fontWeight: '500',
    },
    typeContainer: {
        flexDirection: 'row',
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
        marginRight: 10,
        backgroundColor: APP_COLORS.white,
    },
    typeButtonSelected: {
        borderColor: APP_COLORS.primary,
        backgroundColor: APP_COLORS.primary + '10',
    },
    typeButtonText: {
        marginLeft: 6,
        fontSize: 14,
        color: APP_COLORS.black,
    },
    typeButtonTextSelected: {
        color: APP_COLORS.primary,
        fontWeight: 'bold',
    },
    formGroup: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
    },
    row: {
        flexDirection: 'row',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: APP_COLORS.white,
        padding: 16,
        borderRadius: 8,
    },
    switchLabel: {
        fontSize: 16,
        color: APP_COLORS.black,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: APP_COLORS.white,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.lightGray,
    },
    saveButton: {
        backgroundColor: APP_COLORS.primary,
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveButtonText: {
        color: APP_COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
