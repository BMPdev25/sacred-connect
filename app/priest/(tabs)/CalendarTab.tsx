import React, { useState, useCallback, useMemo, memo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarProvider, ExpandableCalendar, AgendaList } from 'react-native-calendars';
import { APP_COLORS } from '../../../constants/Colors';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import priestService from '../../../services/priestService';
import { Ionicons } from '@expo/vector-icons';
import { AvailabilityManager } from '../../../components/AvailabilityManager';

// Memoized booking card component for better list performance
const BookingCard = memo(({ item, cardStyle, isLarge }: { item: any; cardStyle: any; isLarge: boolean }) => (
    <TouchableOpacity
        style={cardStyle}
        onPress={() => router.push({
            pathname: "/PriestBookingDetails",
            params: { booking: JSON.stringify(item) }
        })}
        activeOpacity={0.9}
    >
        <View style={[styles.timeStripe, isLarge && styles.timeStripeLarge]}>
            <Text style={[styles.timeText, isLarge && styles.timeTextLarge]}>
                {item.startTime || item.time || '00:00'}
            </Text>
        </View>
        <View style={[styles.cardContent, isLarge && styles.cardContentCenter]}>
            <Text style={[styles.ceremonyName, isLarge && styles.textLarge]}>
                {item.ceremonyType || item.ceremony}
            </Text>
            <Text style={[styles.clientName, isLarge && styles.textMedium]}>
                {item.devoteeId?.name || 'Client'}
            </Text>
            <View style={[styles.locationRow, isLarge && { marginTop: 8 }]}>
                <Ionicons name="location-outline" size={isLarge ? 20 : 14} color={APP_COLORS.gray} />
                <Text style={[styles.locationText, isLarge && styles.textMedium]} numberOfLines={2}>
                    {item.location?.address || `${item.location?.city || 'Location'}`}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
));

export default function CalendarTab() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [sections, setSections] = useState<any[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'bookings' | 'availability'>('bookings');

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
            const sectionData = Object.keys(grouped).sort((a, b) => a.localeCompare(b)).map(date => ({
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

    const totalItems = useMemo(() => sections.reduce((acc, s) => acc + s.data.length, 0), [sections]);

    const cardStyle = useMemo(() => {
        if (totalItems === 1) return [styles.card, styles.cardSingle];
        if (totalItems === 2) return [styles.card, styles.cardDouble];
        return styles.card;
    }, [totalItems]);

    const isLarge = totalItems <= 2;

    const renderItem = useCallback(({ item }: { item: any }) => (
        <BookingCard item={item} cardStyle={cardStyle} isLarge={isLarge} />
    ), [cardStyle, isLarge]);

    const theme = useMemo(() => ({
        selectedDayBackgroundColor: APP_COLORS.primary,
        todayTextColor: APP_COLORS.primary,
        dotColor: APP_COLORS.primary,
        arrowColor: APP_COLORS.primary,
        stylesheet: {
            calendar: {
                header: {
                    paddingTop: 0,
                    marginTop: 0,
                }
            }
        }
    }), []);

    return (
        <View style={styles.container}>
            <View style={styles.headerTabs}>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'bookings' && styles.activeTab]}
                    onPress={() => setViewMode('bookings')}
                >
                    <Text style={[styles.tabText, viewMode === 'bookings' && styles.activeTabText]}>Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'availability' && styles.activeTab]}
                    onPress={() => setViewMode('availability')}
                >
                    <Text style={[styles.tabText, viewMode === 'availability' && styles.activeTabText]}>Availability</Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'bookings' ? (
                loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={APP_COLORS.primary} />
                    </View>
                ) : (
                    <CalendarProvider
                        date={today}
                        showTodayButton
                        theme={theme}
                        // Add key to force re-render when switching back to this view or when data changes significantly if needed
                        key={sections.length > 0 ? 'loaded' : 'empty'}
                    >
                        <ExpandableCalendar
                            firstDay={1}
                            markedDates={markedDates}
                            theme={theme}
                            disablePan={false}
                            hideKnob={false}
                            style={styles.calendar}
                        />

                        <View style={styles.listContainer}>
                            {sections.length > 0 ? (
                                <AgendaList
                                    sections={sections}
                                    renderItem={renderItem}
                                    sectionStyle={styles.sectionHeader}
                                    contentContainerStyle={{ paddingBottom: 100 }}
                                />
                            ) : (
                                <View style={styles.empty}>
                                    <Text style={styles.emptyText}>No upcoming bookings found.</Text>
                                </View>
                            )}
                        </View>
                    </CalendarProvider>
                )
            ) : (
                <AvailabilityManager />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    headerTabs: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: APP_COLORS.white,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: APP_COLORS.lightGray + '40',
    },
    activeTab: {
        backgroundColor: APP_COLORS.primary,
    },
    tabText: {
        fontWeight: 'bold',
        color: APP_COLORS.gray,
    },
    activeTabText: {
        color: APP_COLORS.white,
    },
    calendar: {
        paddingTop: 0, // Ensure no top padding
        marginTop: 0, // Ensure no top margin
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
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
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        minHeight: 90,
    },
    cardSingle: {
        marginTop: 20,
        minHeight: 400,
        marginHorizontal: 20,
    },
    cardDouble: {
        marginTop: 16,
        minHeight: 200,
        marginHorizontal: 18,
    },
    timeStripe: {
        backgroundColor: APP_COLORS.primary + '15', // lighter opacity
        width: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: APP_COLORS.lightGray,
    },
    timeStripeLarge: {
        width: 100,
    },
    timeText: {
        fontWeight: 'bold',
        color: APP_COLORS.primary,
        fontSize: 16,
    },
    timeTextLarge: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    cardContentCenter: {
        justifyContent: 'center',
    },
    ceremonyName: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 6,
        color: APP_COLORS.black,
    },
    textLarge: {
        fontSize: 28,
        marginBottom: 12,
    },
    clientName: {
        fontSize: 14,
        color: APP_COLORS.gray,
        marginBottom: 6,
        fontWeight: '500',
    },
    textMedium: {
        fontSize: 18,
        marginBottom: 10,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
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
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
