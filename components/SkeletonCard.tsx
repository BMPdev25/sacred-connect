import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue, ViewStyle } from 'react-native';
import { APP_COLORS } from '../constants/Colors';

interface SkeletonCardProps {
    height?: DimensionValue;
    width?: DimensionValue;
    style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    height = 120,
    width = '100%',
    style
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { height, width, opacity },
                style
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E1E9EE',
        borderRadius: 8,
        marginBottom: 12,
    },
});
