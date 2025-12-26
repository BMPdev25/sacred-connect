import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { APP_COLORS } from '../../../constants/Colors';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import priestService from '../../../services/priestService';
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ScheduleTab() {
    const { userInfo } = useSelector((state: RootState) => state.auth);
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [markedDates, setMarkedDates] = useState<any>({});

    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [])
    );

    const loadBookings = async () => {
        if (!userInfo?._id) return;
        try {
            setLoading(true);
            const data = await priestService.getBookings(userInfo._id, 'confirmed');
            const arr = Array.isArray(data) ? data : data?.data || [];

            setBookings(arr);

            // Generate markers
            const markers: any = {};
            arr.forEach((b: any) => {
                const date = new Date(b.date).toISOString().split('T')[0];
                markers[date] = { marked: true, dotColor: APP_COLORS.primary };
            });
            // Highlight selected
            markers[selectedDate] = { ...markers[selectedDate], selected: true, selectedColor: APP_COLORS.primary };

            setMarkedDates(markers);
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
        setMarkedDates((prev: any) => {
            const newMarks = { ...prev };
            // Unselect previous
            Object.keys(newMarks).forEach(key => {
                if (newMarks[key].selected) {
                    const { selected, selectedColor, ...rest } = newMarks[key];
                    newMarks[key] = rest;
                }
            });
            // Select new
            newMarks[day.dateString] = {
                ...(newMarks[day.dateString] || {}),
                selected: true,
                selectedColor: APP_COLORS.primary
            };
            return newMarks;
        });
    };

    const selectedBookings = bookings.filter(b => {
        const d = new Date(b.date).toISOString().split('T')[0];
        return d === selectedDate;
    });

    const renderBooking = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
                pathname: "/PriestBookingDetails",
                params: { booking: JSON.stringify(item) }
            })}
        >
            <View style={styles.timeStripe}>
                <Text style={styles.timeText}>{item.startTime || item.time}</Text>
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
    );

    return (
        <SafeAreaView style={styles.container}>


            <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                    todayTextColor: APP_COLORS.primary,
                    arrowColor: APP_COLORS.primary,
                    selectedDayBackgroundColor: APP_COLORS.primary,
                }}
            />

            <View style={styles.agendaContainer}>
                <Text style={styles.dateTitle}>
                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color={APP_COLORS.primary} />
                ) : (
                    <FlatList
                        data={selectedBookings}
                        renderItem={renderBooking}
                        keyExtractor={item => item._id}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No bookings for this day</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    header: {
        padding: 16,
        backgroundColor: APP_COLORS.white,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: APP_COLORS.black,
    },
    agendaContainer: {
        flex: 1,
        padding: 16,
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: APP_COLORS.black,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: APP_COLORS.white,
        borderRadius: 8,
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
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: APP_COLORS.gray,
    }
});
