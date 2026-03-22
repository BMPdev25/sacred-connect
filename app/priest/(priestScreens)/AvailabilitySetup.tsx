import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Switch,
    TextInput,
    Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { APP_COLORS } from "../../../constants/Colors";
import priestService from "../../../services/priestService";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function AvailabilitySetup() {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [availability, setAvailability] = useState<any>({
        monday: { available: true, startTime: "09:00", endTime: "18:00" },
        tuesday: { available: true, startTime: "09:00", endTime: "18:00" },
        wednesday: { available: true, startTime: "09:00", endTime: "18:00" },
        thursday: { available: true, startTime: "09:00", endTime: "18:00" },
        friday: { available: true, startTime: "09:00", endTime: "18:00" },
        saturday: { available: false, startTime: "09:00", endTime: "18:00" },
        sunday: { available: false, startTime: "09:00", endTime: "18:00" },
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await priestService.getProfile();
                const profile = res.profile || res;
                if (profile?.availability?.weeklySchedule) {
                    const schedule = profile.availability.weeklySchedule;
                    const newState = { ...availability };
                    
                    DAYS.forEach(day => {
                        const slots = schedule[day] || [];
                        if (slots.length > 0) {
                            const [start, end] = slots[0].split("-");
                            newState[day] = { available: true, startTime: start, endTime: end };
                        } else {
                            newState[day] = { ...newState[day], available: false };
                        }
                    });
                    setAvailability(newState);
                }
            } catch (err) {
                console.warn("Failed to fetch existing availability:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleDay = (day: string) => {
        setAvailability((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], available: !prev[day].available }
        }));
    };

    const updateTime = (day: string, field: "startTime" | "endTime", value: string) => {
        // Basic time format validation helper could be added here
        setAvailability((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const applyToAll = (fromDay: string) => {
        const source = availability[fromDay];
        const newState = { ...availability };
        DAYS.forEach(day => {
            newState[day] = { ...source };
        });
        setAvailability(newState);
        Alert.alert("Success", `Applied ${fromDay}'s schedule to all days.`);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            const weeklySchedule: any = {};
            DAYS.forEach(day => {
                const data = availability[day];
                if (data.available && data.startTime && data.endTime) {
                    weeklySchedule[day] = [`${data.startTime}-${data.endTime}`];
                } else {
                    weeklySchedule[day] = [];
                }
            });

            await priestService.updateProfile({
                availability: { weeklySchedule }
            });

            Alert.alert("Success", "Availability updated!", [
                { text: "Continue", onPress: () => router.push("/priest/HomeTab" as any) }
            ]);
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to update availability");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={APP_COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={APP_COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Set Availability</Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <Text style={styles.subtitle}>
                    Set your typical weekly working hours. You can always change these later or add date-specific overrides in your profile.
                </Text>

                {DAYS.map((day) => (
                    <View key={day} style={styles.dayCard}>
                        <View style={styles.dayHeader}>
                            <View style={styles.dayInfo}>
                                <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                                <Text style={[styles.statusText, { color: availability[day].available ? APP_COLORS.success : APP_COLORS.gray }]}>
                                    {availability[day].available ? "Available" : "Unavailable"}
                                </Text>
                            </View>
                            <Switch
                                value={availability[day].available}
                                onValueChange={() => toggleDay(day)}
                                trackColor={{ false: "#ddd", true: APP_COLORS.primary + "80" }}
                                thumbColor={availability[day].available ? APP_COLORS.primary : "#f4f3f4"}
                            />
                        </View>

                        {availability[day].available && (
                            <View style={styles.timeSection}>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Start</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={availability[day].startTime}
                                        onChangeText={(v) => updateTime(day, "startTime", v)}
                                        placeholder="09:00"
                                    />
                                </View>
                                <Ionicons name="arrow-forward" size={16} color={APP_COLORS.gray} style={{ marginTop: 20 }} />
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>End</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={availability[day].endTime}
                                        onChangeText={(v) => updateTime(day, "endTime", v)}
                                        placeholder="18:00"
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={styles.applyAllBtn}
                                    onPress={() => applyToAll(day)}
                                >
                                    <Ionicons name="copy-outline" size={18} color={APP_COLORS.primary} />
                                    <Text style={styles.applyAllText}>Apply to all</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}

                <TouchableOpacity 
                    style={[styles.saveBtn, submitting && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={styles.saveBtnText}>Save & Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.skipBtn} 
                    onPress={() => router.push("/priest/HomeTab" as any)}
                >
                    <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: APP_COLORS.background },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        backgroundColor: APP_COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: { padding: 5 },
    headerTitle: { color: APP_COLORS.white, fontSize: 20, fontWeight: "bold" },
    content: { flex: 1, padding: 20 },
    subtitle: { fontSize: 14, color: APP_COLORS.gray, marginBottom: 24, lineHeight: 20 },
    
    dayCard: {
        backgroundColor: APP_COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    dayInfo: {},
    dayName: { fontSize: 16, fontWeight: "bold", color: APP_COLORS.black },
    statusText: { fontSize: 12, marginTop: 2 },
    
    timeSection: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: APP_COLORS.lightGray,
        gap: 12,
    },
    timeInputGroup: { flex: 1 },
    timeLabel: { fontSize: 12, color: APP_COLORS.gray, marginBottom: 4 },
    timeInput: {
        backgroundColor: "#f9f9f9",
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#eee",
        fontSize: 14,
        textAlign: "center",
    },
    applyAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: APP_COLORS.primary + "10",
        padding: 8,
        borderRadius: 8,
    },
    applyAllText: { fontSize: 11, color: APP_COLORS.primary, fontWeight: "600" },
    
    saveBtn: {
        backgroundColor: APP_COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        gap: 8,
    },
    saveBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },
    skipBtn: {
        alignItems: "center",
        padding: 16,
    },
    skipBtnText: { color: APP_COLORS.gray, fontSize: 14 },
});
