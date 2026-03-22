import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { APP_COLORS } from '../constants/Colors';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'filled' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    onPress,
    variant = 'filled',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon,
}) => {
    const isFilled = variant === 'filled';

    const sizeStyles = {
        sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
        md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 15 },
        lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 17 },
    };

    return (
        <TouchableOpacity
            style={[
                styles.base,
                {
                    backgroundColor: isFilled
                        ? disabled
                            ? APP_COLORS.saffron + '80'
                            : APP_COLORS.saffron
                        : 'transparent',
                    borderWidth: isFilled ? 0 : 1.5,
                    borderColor: APP_COLORS.saffron,
                    paddingVertical: sizeStyles[size].paddingVertical,
                    paddingHorizontal: sizeStyles[size].paddingHorizontal,
                },
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={isFilled ? APP_COLORS.white : APP_COLORS.saffron}
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: isFilled ? APP_COLORS.white : APP_COLORS.saffron,
                                fontSize: sizeStyles[size].fontSize,
                                marginLeft: icon ? 8 : 0,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default PrimaryButton;
