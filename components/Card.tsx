import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { APP_COLORS } from '../constants/Colors';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}

const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
    const Wrapper = onPress ? TouchableOpacity : View;

    return (
        <Wrapper
            style={[styles.card, style]}
            {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
        >
            {children}
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: APP_COLORS.surface,
        borderRadius: 16,
        padding: 16,
        shadowColor: APP_COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
});

export default Card;
