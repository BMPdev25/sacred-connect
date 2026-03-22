import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import priestService from '../services/priestService';
import DateTimePicker from '@react-native-community/datetimepicker';

export const AvailabilityManager: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Override editing state
    const [isDayOff, setIsDayOff] = useState(false);
    const [customSlots, setCustomSlots] = useState<{ start: string, end: string }[]>([]);
    const [saving, setSaving] = useState(false);

    // Time picker
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
    const [timeType, setTimeType] = useState<'start' | 'end'>('start');



    // Helper to convert time string "HH:mm" to minutes
    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await priestService.getProfile();
            setProfile(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load availability');
        } finally {
            setLoading(false);
        }
    };

    const getMarkedDates = () => {
        const marked: any = {};
        if (!profile?.availability?.dateOverrides) return marked;

        profile.availability.dateOverrides.forEach((override: any) => {
            const dateStr = new Date(override.date).toISOString().split('T')[0];
            if (override.isUnavailable) {
                marked[dateStr] = { selected: true, selectedColor: APP_COLORS.error, text: 'OFF' };
            } else if (override.customSlots && override.customSlots.length > 0) {
                marked[dateStr] = { selected: true, selectedColor: APP_COLORS.success, text: 'MOD' };
            }
        });

        if (selectedDate) {
            marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: APP_COLORS.primary };
        }

        return marked;
    };

    const handleDayPress = (day: any) => {
        const dateStr = day.dateString;

        // Prevent editing past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(dateStr) < today) {
            Alert.alert("Past Date", "You cannot edit availability for past dates.");
            return;
        }

        setSelectedDate(dateStr);

        // Find existing override
        const override = profile?.availability?.dateOverrides?.find((o: any) =>
            new Date(o.date).toISOString().split('T')[0] === dateStr
        );

        if (override) {
            setIsDayOff(override.isUnavailable);
            setCustomSlots(override.customSlots ? [...override.customSlots] : []);
        } else {
            // Default to day off state for new override or empty
            setIsDayOff(false);
            setCustomSlots([]);
        }
        setShowModal(true);
    };

    const checkForConflicts = async (): Promise<any[]> => {
        if (!process.env.EXPO_PUBLIC_API_URL && !profile?._id) return [];

        try {
            // Fetch ALL confirmed bookings (or filter by date if API supports it)
            // Ideally API should support date range, but for now we fetch confirmed and filter client side
            const bookings = await priestService.getBookings(profile?._id, 'confirmed');

            // Filter for selected date
            const targetDateStr = selectedDate;
            const conflictingBookings = bookings.filter((b: any) => {
                const bookingDate = new Date(b.date).toISOString().split('T')[0];
                return bookingDate === targetDateStr;
            });

            if (conflictingBookings.length === 0) return [];

            // If Day Off -> All bookings on this date are conflicts
            if (isDayOff) return conflictingBookings;

            // If Custom Hours -> Check if booking falls OUTSIDE valid slots
            // A booking is valid if it fits entirely within AT LEAST ONE custom slot
            const conflicts = conflictingBookings.filter((booking: any) => {
                const bookingStart = timeToMinutes(booking.startTime || booking.time);
                const bookingEnd = timeToMinutes(booking.endTime || '23:59'); // Assuming end time if not present, or use duration

                // Check if this booking fits in any custom slot
                const fits = customSlots.some(slot => {
                    const slotStart = timeToMinutes(slot.start);
                    const slotEnd = timeToMinutes(slot.end);
                    return bookingStart >= slotStart && bookingEnd <= slotEnd;
                });

                return !fits; // If it doesn't fit in any slot, it's a conflict
            });

            return conflicts;

        } catch (error) {
            console.error("Error checking conflicts:", error);
            return [];
        }
    };

    const handleSaveWithConflictCheck = async () => {
        setSaving(true);
        try {
            const conflicts = await checkForConflicts();

            if (conflicts.length > 0) {
                Alert.alert(
                    "Conflict with Existing Bookings",
                    `You have ${conflicts.length} confirmed booking(s) that conflict with this availability change.\n\nDo you want to CANCEL these bookings and proceed?`,
                    [
                        {
                            text: "No, Keep Bookings",
                            style: "cancel",
                            onPress: () => setSaving(false)
                        },
                        {
                            text: "Yes, Cancel & Save",
                            style: "destructive",
                            onPress: async () => {
                                await cancelBookings(conflicts);
                                await performSave();
                            }
                        }
                    ]
                );
            } else {
                await performSave();
            }
        } catch (error) {
            console.error(error);
            setSaving(false);
            Alert.alert('Error', 'Failed to check conflicts');
        }
    };

    const cancelBookings = async (bookings: any[]) => {
        for (const booking of bookings) {
            try {
                await priestService.updateBookingStatus(booking._id, 'cancelled', 'Priest unavailable (Schedule Move)');
            } catch (err) {
                console.error(`Failed to cancel booking ${booking._id}`, err);
            }
        }
    };

    const performSave = async () => {
        // Actual save logic (moved from saveOverride)
        try {
            const currentOverrides = profile?.availability?.dateOverrides ? [...profile.availability.dateOverrides] : [];

            // Remove existing override for this date
            const filteredOverrides = currentOverrides.filter((o: any) =>
                new Date(o.date).toISOString().split('T')[0] !== selectedDate
            );

            const newOverride = {
                date: new Date(selectedDate),
                isUnavailable: isDayOff,
                customSlots: isDayOff ? [] : customSlots,
                reason: isDayOff ? 'Day Off' : 'Custom Hours'
            };

            filteredOverrides.push(newOverride);

            // Build full update object
            const newAvailability = {
                ...profile.availability,
                dateOverrides: filteredOverrides
            };

            await priestService.updateProfile({ availability: newAvailability });
            setProfile({ ...profile, availability: newAvailability });
            setShowModal(false);
            Alert.alert('Success', 'Availability updated');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const saveOverride = handleSaveWithConflictCheck; // Alias for button press

    const resetToDefault = async () => {
        setSaving(true);
        try {
            const currentOverrides = profile?.availability?.dateOverrides ? [...profile.availability.dateOverrides] : [];
            const filteredOverrides = currentOverrides.filter((o: any) =>
                new Date(o.date).toISOString().split('T')[0] !== selectedDate
            );

            const newAvailability = {
                ...profile.availability,
                dateOverrides: filteredOverrides
            };

            await priestService.updateProfile({ availability: newAvailability });
            setProfile({ ...profile, availability: newAvailability });
            setShowModal(false);
            Alert.alert('Success', 'Reset to weekly default');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to reset');
        } finally {
            setSaving(false);
        }
    };

    const addSlot = () => {
        setCustomSlots([...customSlots, { start: '09:00', end: '17:00' }]);
        setIsDayOff(false);
    };

    const updateTime = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (date && currentSlotIndex !== null) {
            const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const newSlots = [...customSlots];
            newSlots[currentSlotIndex] = { ...newSlots[currentSlotIndex], [timeType]: timeStr };
            setCustomSlots(newSlots);
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={APP_COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <Calendar
                    onDayPress={handleDayPress}
                    markedDates={getMarkedDates()}
                    theme={{
                        selectedDayBackgroundColor: APP_COLORS.primary,
                        todayTextColor: APP_COLORS.primary,
                        arrowColor: APP_COLORS.primary,
                    }}
                />
            )}

            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit {selectedDate}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={APP_COLORS.gray} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.optionRow}>
                                <Text style={styles.optionLabel}>Mark as Day Off</Text>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, isDayOff && styles.toggleBtnActive]}
                                    onPress={() => { setIsDayOff(!isDayOff); if (!isDayOff) setCustomSlots([]); }}
                                >
                                    <View style={[styles.toggleCircle, isDayOff && styles.toggleCircleActive]} />
                                </TouchableOpacity>
                            </View>

                            {!isDayOff && (
                                <View style={styles.slotsSection}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Custom Hours</Text>
                                        <TouchableOpacity onPress={addSlot}>
                                            <Ionicons name="add-circle" size={24} color={APP_COLORS.success} />
                                        </TouchableOpacity>
                                    </View>

                                    {customSlots.length === 0 ? (
                                        <Text style={styles.helperText}>No custom hours set (Using Weekly Template)</Text>
                                    ) : (
                                        customSlots.map((slot, index) => (
                                            <View key={index} style={styles.slotRow}>
                                                <TouchableOpacity
                                                    style={styles.timeBox}
                                                    onPress={() => { setCurrentSlotIndex(index); setTimeType('start'); setShowTimePicker(true); }}
                                                >
                                                    <Text>{slot.start}</Text>
                                                </TouchableOpacity>
                                                <Text>-</Text>
                                                <TouchableOpacity
                                                    style={styles.timeBox}
                                                    onPress={() => { setCurrentSlotIndex(index); setTimeType('end'); setShowTimePicker(true); }}
                                                >
                                                    <Text>{slot.end}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => {
                                                    const newSlots = [...customSlots];
                                                    newSlots.splice(index, 1);
                                                    setCustomSlots(newSlots);
                                                }}>
                                                    <Ionicons name="trash-outline" size={20} color={APP_COLORS.error} />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.btn, styles.resetBtn]}
                                    onPress={resetToDefault}
                                    disabled={saving}
                                >
                                    <Text style={styles.resetBtnText}>Reset to Default</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, styles.saveBtn]}
                                    onPress={saveOverride}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {showTimePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={updateTime}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: APP_COLORS.background },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: APP_COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: APP_COLORS.lightGray },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    optionLabel: { fontSize: 16 },
    toggleBtn: { width: 50, height: 30, borderRadius: 15, backgroundColor: APP_COLORS.lightGray, padding: 2 },
    toggleBtnActive: { backgroundColor: APP_COLORS.primary },
    toggleCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: APP_COLORS.white },
    toggleCircleActive: { transform: [{ translateX: 20 }] },
    slotsSection: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold' },
    helperText: { color: APP_COLORS.gray, fontStyle: 'italic' },
    slotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    timeBox: { backgroundColor: APP_COLORS.lightGray + '40', padding: 10, borderRadius: 8, minWidth: 70, alignItems: 'center' },
    actionButtons: { gap: 10, marginTop: 10, marginBottom: 40 },
    btn: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    resetBtn: { backgroundColor: APP_COLORS.lightGray + '40' },
    resetBtnText: { color: APP_COLORS.error, fontWeight: 'bold' },
    saveBtn: { backgroundColor: APP_COLORS.primary },
    saveBtnText: { color: APP_COLORS.white, fontWeight: 'bold' },
});
