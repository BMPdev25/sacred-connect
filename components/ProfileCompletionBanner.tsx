import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { APP_COLORS } from '../constants/Colors';

interface ProfileCompletionData {
    completionPercentage: number;
    missingFields: string[];
    completedFields: string[];
    isVerified: boolean;
    hasPendingVerification: boolean;
    canAcceptRequests: boolean;
}

interface ProfileCompletionBannerProps {
    data: ProfileCompletionData;
    onDismiss?: () => void;
}

const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({
    data,
    onDismiss,
}) => {
    const [dismissed, setDismissed] = useState(false);
    const [progressAnim] = useState(new Animated.Value(0));

    React.useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: data.completionPercentage,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [data.completionPercentage]);

    if (dismissed || data.completionPercentage === 100) {
        return null;
    }

    const getProgressColor = () => {
        if (data.completionPercentage < 50) return '#EF5350'; // Red
        if (data.completionPercentage < 80) return '#FF9800'; // Orange
        return '#4CAF50'; // Green
    };

    const getMessage = () => {
        if (data.completionPercentage < 30) {
            return {
                title: 'Get Started with Your Profile',
                description: 'Complete your profile to start accepting client requests and showcase your expertise to devotees.',
            };
        } else if (data.completionPercentage < 60) {
            return {
                title: "You're Making Progress!",
                description: 'Add more details to your profile to increase your visibility and start receiving booking requests.',
            };
        } else if (data.completionPercentage < 80) {
            return {
                title: 'Almost There!',
                description: 'Complete verification and add your services to begin accepting client requests.',
            };
        } else if (!data.isVerified) {
            return {
                title: 'Final Step: Verification',
                description: 'Upload your verification documents to start accepting client requests and build your reputation.',
            };
        } else {
            return {
                title: 'One More Step!',
                description: 'Complete the remaining fields to unlock full access and start accepting bookings.',
            };
        }
    };

    const formatFieldName = (field: string): string => {
        const fieldMap: { [key: string]: string } = {
            basicInfo: 'Basic Information',
            languages: 'Languages Spoken',
            profilePicture: 'Profile Picture',
            description: 'Bio/Description',
            experience: 'Experience',
            services: 'Services/Ceremonies',
            location: 'Location',
            documents: 'Verification Documents',
        };
        return fieldMap[field] || field;
    };

    const message = getMessage();
    const progressColor = getProgressColor();

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={APP_COLORS.primary} />
                    <Text style={styles.title}>{message.title}</Text>
                </View>
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={APP_COLORS.gray} />
                </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                    <Animated.View
                        style={[
                            styles.progressBarFill,
                            {
                                width: progressWidth,
                                backgroundColor: progressColor,
                            },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>{data.completionPercentage}%</Text>
            </View>

            <Text style={styles.description}>{message.description}</Text>

            {data.missingFields.length > 0 && (
                <View style={styles.missingFieldsContainer}>
                    <Text style={styles.missingFieldsLabel}>Missing:</Text>
                    <Text style={styles.missingFieldsText}>
                        {data.missingFields.map(formatFieldName).join(', ')}
                    </Text>
                </View>
            )}

            {data.hasPendingVerification && (
                <View style={styles.pendingBadge}>
                    <Ionicons name="time-outline" size={16} color={APP_COLORS.warning} />
                    <Text style={styles.pendingText}>Verification Pending</Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.completeButton}
                onPress={() => router.push('/priest/(tabs)/ProfileTab')}
            >
                <Text style={styles.completeButtonText}>Complete Profile</Text>
                <Ionicons name="arrow-forward" size={18} color={APP_COLORS.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: APP_COLORS.black,
        marginLeft: 8,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: APP_COLORS.black,
        marginLeft: 12,
        minWidth: 40,
    },
    description: {
        fontSize: 14,
        color: '#424242',
        lineHeight: 20,
        marginBottom: 12,
    },
    missingFieldsContainer: {
        marginBottom: 12,
    },
    missingFieldsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: APP_COLORS.gray,
        marginBottom: 4,
    },
    missingFieldsText: {
        fontSize: 12,
        color: '#616161',
        lineHeight: 18,
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    pendingText: {
        fontSize: 12,
        color: APP_COLORS.warning || '#F57C00',
        marginLeft: 6,
        fontWeight: '600',
    },
    completeButton: {
        backgroundColor: APP_COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    completeButtonText: {
        color: APP_COLORS.white,
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default ProfileCompletionBanner;
