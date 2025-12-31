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

    const totalItems = useMemo(() => sections.reduce((acc, s) => acc + s.data.length, 0), [sections]);

    const getCardStyles = useCallback(() => {
        if (totalItems === 1) return [styles.card, styles.cardSingle];
        if (totalItems === 2) return [styles.card, styles.cardDouble];
        return styles.card;
    }, [totalItems]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={getCardStyles()}
            onPress={() => router.push({
                pathname: "/PriestBookingDetails",
                params: { booking: JSON.stringify(item) }
            })}
            activeOpacity={0.9}
        >
            <View style={[styles.timeStripe, totalItems <= 2 && styles.timeStripeLarge]}>
                <Text style={[styles.timeText, totalItems <= 2 && styles.timeTextLarge]}>
                    {item.startTime || item.time || '00:00'}
                </Text>
            </View>
            <View style={[styles.cardContent, totalItems <= 2 && styles.cardContentCenter]}>
                <Text style={[styles.ceremonyName, totalItems <= 2 && styles.textLarge]}>
                    {item.ceremonyType || item.ceremony}
                </Text>
                <Text style={[styles.clientName, totalItems <= 2 && styles.textMedium]}>
                    {item.devoteeId?.name || 'Client'}
                </Text>
                <View style={[styles.locationRow, totalItems <= 2 && { marginTop: 8 }]}>
                    <Ionicons name="location-outline" size={totalItems <= 2 ? 20 : 14} color={APP_COLORS.gray} />
                    <Text style={[styles.locationText, totalItems <= 2 && styles.textMedium]} numberOfLines={2}>
                        {item.location?.address || `${item.location?.city || 'Location'}`}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    ), [getCardStyles, totalItems]);

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
                    style={styles.calendar}
                />

                <View style={styles.listContainer}>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={APP_COLORS.primary} />
                    ) : sections.length > 0 ? (
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
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
    }
});
