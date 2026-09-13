import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ToastNotificationProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'info' | 'error';
    onDismiss: () => void;
    duration?: number;
}

export default function ToastNotification({
    visible,
    message,
    type = 'success',
    onDismiss,
    duration = 3200
}: ToastNotificationProps) {
    const { colors, theme } = useTheme();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (visible) {
                onDismiss();
            }
        });
    };

    if (!visible && (opacity as any)._value === 0) {
        return null;
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle' as const, color: '#10B981' };
            case 'error':
                return { name: 'alert-circle' as const, color: '#EF4444' };
            default:
                return { name: 'information-circle' as const, color: colors.primary };
        }
    };

    const iconInfo = getIcon();

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.wrapper,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={hideToast}
                style={[
                    styles.toastContainer,
                    {
                        backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    },
                ]}
            >
                <View style={[styles.iconWrapper, { backgroundColor: iconInfo.color + '18' }]}>
                    <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
                </View>
                <View style={styles.textWrapper}>
                    <Text style={[styles.titleText, { color: colors.text }]}>
                        {type === 'success' ? 'Erfolgreich!' : 'Hinweis'}
                    </Text>
                    <Text style={[styles.messageText, { color: theme === 'dark' ? '#9CA3AF' : '#4B5563' }]} numberOfLines={2}>
                        {message}
                    </Text>
                </View>
                <Ionicons name="close" size={18} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} style={styles.closeIcon} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 24,
        left: 16,
        right: 16,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        maxWidth: 500,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textWrapper: {
        flex: 1,
        marginRight: 8,
    },
    titleText: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 13,
        lineHeight: 18,
    },
    closeIcon: {
        marginLeft: 4,
    },
});
