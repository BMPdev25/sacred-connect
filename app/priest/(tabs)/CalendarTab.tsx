import React, { useState, useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarProvider, ExpandableCalendar, AgendaList } from 'react-native-calendars';
import { APP_COLORS } from '../../../constants/Colors';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import priestService from '../../../services/priestService';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarTab() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [sections, setSections] = useState<any[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [loading, setLoading] = useState(false);

    // Default to today
    const today = new Date().toISOString().split('T')[0];

    const loadBookings = useCallback(async () => {
        if (!userInfo?._id) return;
        try {
            setLoading(true);
            const data = await priestService.getBookings(userInfo._id, 'confirmed');
            const arr = Array.isArray(data) ? data : data?.data || [];

            // Group by date: { '2023-10-22': [b1, b2] }
            const grouped: any = {};
            const markers: any = {};

            arr.forEach((b: any) => {
                const date = new Date(b.date).toISOString().split('T')[0];
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(b);
                markers[date] = { marked: true, dotColor: APP_COLORS.primary };
            });

            // Convert to sections array for AgendaList
            // [{ title: '2023-10-22', data: [...] }]
            const sectionData = Object.keys(grouped).sort().map(date => ({
                title: date,
                data: grouped[date]
            }));

            setSections(sectionData);
            setMarkedDates(markers);
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    }, [userInfo?._id]);

    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [loadBookings])
    );

    const renderItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
                pathname: "/PriestBookingDetails",
                params: { booking: JSON.stringify(item) }
            })}
        >
            <View style={styles.timeStripe}>
                <Text style={styles.timeText}>{item.startTime || item.time || '00:00'}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.ceremonyName}>{item.ceremonyType || item.ceremony}</Text>
                <Text style={styles.clientName}>{item.devoteeId?.name || 'Client'}</Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={APP_COLORS.gray} />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {item.location?.address || `${item.location?.city || 'Location'}`}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    ), []);

    const theme = useMemo(() => ({
        selectedDayBackgroundColor: APP_COLORS.primary,
        todayTextColor: APP_COLORS.primary,
        dotColor: APP_COLORS.primary,
        arrowColor: APP_COLORS.primary,
    }), []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <CalendarProvider
                date={today}
                showTodayButton
                theme={theme}
            >
                <ExpandableCalendar
                    firstDay={1}
                    markedDates={markedDates}
                    theme={theme}
                    disablePan={false}
                    hideKnob={false}
                />

                <View style={styles.listContainer}>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={APP_COLORS.primary} />
                    ) : sections.length > 0 ? (
                        <AgendaList
                            sections={sections}
                            renderItem={renderItem}
                            sectionStyle={styles.sectionHeader}
                        />
                    ) : (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No upcoming bookings found.</Text>
                        </View>
                    )}
                </View>
            </CalendarProvider>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    listContainer: {
        flex: 1,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: APP_COLORS.gray,
        backgroundColor: APP_COLORS.background,
        paddingVertical: 8,
        paddingHorizontal: 16,
        textTransform: 'uppercase',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: APP_COLORS.white,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 1,
    },
    timeStripe: {
        backgroundColor: APP_COLORS.primary + '20',
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: APP_COLORS.lightGray,
    },
    timeText: {
        fontWeight: 'bold',
        color: APP_COLORS.primary,
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    ceremonyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    clientName: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 12,
        color: APP_COLORS.gray,
        marginLeft: 4,
        flex: 1,
    },
    empty: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: APP_COLORS.gray,
        fontSize: 16,
    }
});
