import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { APP_COLORS } from '../constants/Colors';
import priestService from '../services/priestService';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const WeeklyTemplateEditor: React.FC = () => {
    const navigation = useNavigation();
    const [schedule, setSchedule] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingSlot, setEditingSlot] = useState<{ day: string, index: number, type: 'start' | 'end' } | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            const profile = await priestService.getProfile();
            // Initialize with empty arrays if not present
            const weekly = profile.availability?.weeklySchedule || {};
            const initialSchedule: any = {};

            DAYS.forEach(day => {
                // slots might be ["09:00-17:00"] or [{start:.., end:..}] if legacy
                const rawSlots = weekly[day] || (weekly.get && weekly.get(day)) || [];

                initialSchedule[day] = rawSlots.map((slot: any) => {
                    if (typeof slot === 'string') {
                        const [start, end] = slot.split('-');
                        return { start, end };
                    }
                    return slot; // fallback for legacy objects
                });
            });

            setSchedule(initialSchedule);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const validateSchedule = () => {
        for (const day of DAYS) {
            const slots = schedule[day] || [];
            if (slots.length <= 1) continue;

            // Convert slots to minutes for comparison
            const timeSlots = slots.map((s: any) => ({
                start: timeToMinutes(s.start),
                end: timeToMinutes(s.end)
            })).sort((a: any, b: any) => a.start - b.start);

            for (let i = 0; i < timeSlots.length - 1; i++) {
                if (timeSlots[i].end > timeSlots[i + 1].start) {
                    Alert.alert('Invalid Schedule', `Overlapping time slots found on ${day.charAt(0).toUpperCase() + day.slice(1)}.`);
                    return false;
                }
            }
        }
        return true;
    };

    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };



    const handleSave = async () => {
        if (!validateSchedule()) return;



        setSaving(true);
        try {
            // Prepare update object
            // Just update availability.weeklySchedule
            // We need to fetch existing profile to keep dateOverrides? 
            // Or just send partial update if backend supports it.
            // Our priestController.updateProfile handles nested updates by replacing entire object if provided?
            // "if (availability) updateData.availability = availability;" -> replaces whole object.
            // This is dangerous if dateOverrides are lost.
            // We should fetch current profile, merge, and update.
            // But usually for partial updates we want PATCH behavior. 
            // In our current controller implementation, providing `availability` replaces `availability`.
            // So we must include the existing `dateOverrides` if we don't want to lose them.

            const currentProfile = await priestService.getProfile();
            const currentAvailability = currentProfile.availability || {};

            // Convert schedule objects back to strings ["HH:mm-HH:mm"]
            const formattedSchedule: any = {};
            DAYS.forEach(day => {
                const daySlots = schedule[day] || [];
                formattedSchedule[day] = daySlots.map((slot: any) => `${slot.start}-${slot.end}`);
            });

            const newAvailability = {
                ...currentAvailability,
                weeklySchedule: formattedSchedule,
                dateOverrides: currentAvailability.dateOverrides || [] // Preserve overrides
            };

            await priestService.updateProfile({ availability: newAvailability });
            Alert.alert('Success', 'Weekly schedule updated');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    const addSlot = (day: string) => {
        const daySlots = [...(schedule[day] || [])];
        daySlots.push({ start: '09:00', end: '17:00' });
        setSchedule({ ...schedule, [day]: daySlots });
    };

    const removeSlot = (day: string, index: number) => {
        const daySlots = [...schedule[day]];
        daySlots.splice(index, 1);
        setSchedule({ ...schedule, [day]: daySlots });
    };

    const copyToAll = (sourceDay: string) => {
        const sourceSlots = schedule[sourceDay];
        const newSchedule = { ...schedule };
        DAYS.forEach(day => {
            if (day !== sourceDay) {
                newSchedule[day] = JSON.parse(JSON.stringify(sourceSlots));
            }
        });
        setSchedule(newSchedule);
        Alert.alert('Copied', `Copied ${sourceDay}'s schedule to all days`);
    };

    const updateTime = (event: any, date?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);

        if (date && editingSlot) {
            const { day, index, type } = editingSlot;
            const daySlots = [...schedule[day]];
            const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

            daySlots[index] = { ...daySlots[index], [type]: timeStr };
            setSchedule({ ...schedule, [day]: daySlots });
        }
    };

    const openTimePicker = (day: string, index: number, type: 'start' | 'end', currentTime: string) => {
        const [hours, minutes] = currentTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 0, minutes || 0);
        setTempDate(date);
        setEditingSlot({ day, index, type });
        setShowTimePicker(true);
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={APP_COLORS.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.title}>Weekly Schedule</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={APP_COLORS.white} /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {DAYS.map(day => (
                    <View key={day} style={styles.dayContainer}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                            <View style={styles.dayActions}>
                                <TouchableOpacity onPress={() => copyToAll(day)} style={styles.actionBtn}>
                                    <Ionicons name="copy-outline" size={18} color={APP_COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addSlot(day)} style={styles.actionBtn}>
                                    <Ionicons name="add-circle-outline" size={22} color={APP_COLORS.success} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {(schedule[day] && schedule[day].length > 0) ? (
                            schedule[day].map((slot: any, index: number) => (
                                <View key={index} style={styles.slotRow}>
                                    <TouchableOpacity
                                        style={styles.timeBox}
                                        onPress={() => openTimePicker(day, index, 'start', slot.start)}
                                    >
                                        <Text style={styles.timeText}>{slot.start}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.toText}>to</Text>
                                    <TouchableOpacity
                                        style={styles.timeBox}
                                        onPress={() => openTimePicker(day, index, 'end', slot.end)}
                                    >
                                        <Text style={styles.timeText}>{slot.end}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeSlot(day, index)} style={styles.removeBtn}>
                                        <Ionicons name="trash-outline" size={20} color={APP_COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.unavailableText}>Unavailable</Text>
                        )}
                    </View>
                ))}
            </ScrollView>

            {showTimePicker && (
                <DateTimePicker
                    value={tempDate}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={updateTime}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: APP_COLORS.lightGray },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: APP_COLORS.primary,
        elevation: 4,
    },
    title: { fontSize: 18, fontWeight: 'bold', color: APP_COLORS.white },
    saveText: { fontSize: 16, color: APP_COLORS.white, fontWeight: 'bold' },
    content: { padding: 16 },
    dayContainer: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dayName: { fontSize: 16, fontWeight: 'bold', color: APP_COLORS.black },
    dayActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { padding: 4 },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeBox: {
        backgroundColor: APP_COLORS.lightGray + '40',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    timeText: { fontSize: 16, fontWeight: '500' },
    toText: { marginHorizontal: 12, color: APP_COLORS.gray },
    removeBtn: { marginLeft: 'auto', padding: 4 },
    unavailableText: { color: APP_COLORS.gray, fontStyle: 'italic', marginLeft: 4 },
});
