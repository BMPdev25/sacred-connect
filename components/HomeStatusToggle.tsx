import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_COLORS } from '../constants/Colors';
import priestService from '../services/priestService';
import { useDispatch } from 'react-redux';
import { getEarnings } from '../redux/slices/priestSlice'; // Optional, if status affects earnings logic

interface HomeStatusToggleProps {
    currentStatus: 'available' | 'busy' | 'offline';
    autoToggle: boolean;
    isVerified?: boolean;
    completionPercentage?: number;
    onStatusChange: (newStatus: 'available' | 'busy' | 'offline') => void;
    style?: any;
    disabled?: boolean;
    disabledMessage?: string;
}

export const HomeStatusToggle: React.FC<HomeStatusToggleProps> = ({
    currentStatus,
    autoToggle,
    isVerified = false,
    completionPercentage = 0,
    onStatusChange,
    style,
    disabled = false,
    disabledMessage
}) => {
    const [loading, setLoading] = useState(false);

    const isOnline = currentStatus === 'available';

    const handleToggle = async (value: boolean) => {
        // Prevent going online if not verified or incomplete
        if (value) {
            if (!isVerified) {
                Alert.alert(
                    "Verification Required",
                    "Your profile is not yet verified by admins. You can only go online once verification is complete."
                );
                return;
            }
            if (completionPercentage < 100) {
                Alert.alert(
                    "Profile Incomplete",
                    `Your profile is only ${completionPercentage}% complete. Please complete your profile setup to 100% to go online.`
                );
                return;
            }
        }

        const newStatus = value ? 'available' : 'offline';

        // Optimistic update
        onStatusChange(newStatus);
        setLoading(true);

        try {
            await priestService.toggleStatus({ status: newStatus });
        } catch (error: any) {
            console.error('Status toggle error:', error);
            // Revert on error
            onStatusChange(currentStatus);
            Alert.alert('Error', 'Failed to update status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[
            styles.container, 
            isOnline ? styles.onlineContainer : styles.offlineContainer, 
            disabled && styles.disabledContainer,
            style
        ]}>
            <View style={[styles.iconContainer, disabled && styles.disabledIconContainer]}>
                <Ionicons
                    name={isOnline ? "flash" : "moon"}
                    size={24}
                    color={disabled ? APP_COLORS.gray : (isOnline ? APP_COLORS.white : APP_COLORS.gray)}
                />
            </View>

            <View style={styles.textContainer}>
                <Text style={[
                    styles.statusLabel, 
                    isOnline ? styles.onlineText : styles.offlineText,
                    disabled && styles.disabledText
                ]}>
                    {disabled && !isOnline ? (disabledMessage || 'Verification Pending') : (isOnline ? 'You are Online' : 'You are Offline')}
                </Text>
                <Text style={[
                    styles.statusSubtext, 
                    isOnline ? styles.onlineSubtext : styles.offlineSubtext,
                    disabled && styles.disabledSubtext
                ]}>
                    {disabled && !isOnline 
                        ? 'Profile is under review' 
                        : (isOnline ? 'Receiving new requests' : 'Go online to receive jobs')}
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="small" color={isOnline ? APP_COLORS.white : APP_COLORS.gray} />
            ) : !disabled ? (
                <Switch
                    trackColor={{ false: '#e0e0e0', true: 'rgba(255,255,255,0.4)' }}
                    thumbColor={isOnline ? APP_COLORS.white : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={handleToggle}
                    value={isOnline}
                />
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    disabledContainer: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
        elevation: 0,
        shadowOpacity: 0,
    },
    onlineContainer: {
        backgroundColor: APP_COLORS.primary,
    },
    offlineContainer: {
        backgroundColor: APP_COLORS.white,
        borderWidth: 1,
        borderColor: APP_COLORS.lightGray,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    disabledIconContainer: {
        backgroundColor: '#eee',
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
        fontFamily: 'serif',
    },
    disabledText: {
        color: '#999',
    },
    disabledSubtext: {
        color: '#bbb',
    },
    onlineText: {
        color: APP_COLORS.white,
    },
    offlineText: {
        color: APP_COLORS.tertiary,
    },
    statusSubtext: {
        fontSize: 13,
    },
    onlineSubtext: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    offlineSubtext: {
        color: APP_COLORS.gray,
    },
});
