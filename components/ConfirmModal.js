import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ConfirmModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Bestätigen",
    cancelText = "Abbrechen",
    type = "default" // 'default' | 'destructive'
}) {
    const { colors, theme } = useTheme();
    const styles = getStyles(colors, theme);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalView}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={type === 'destructive' ? "warning-outline" : "help-circle-outline"}
                            size={40}
                            color={type === 'destructive' ? "#ff6b6b" : colors.primary}
                        />
                    </View>

                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalText}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {cancelText && (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonCancel]}
                                onPress={onClose}
                            >
                                <Text style={styles.textStyleCancel}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                type === 'destructive' ? styles.buttonDestructive : styles.buttonConfirm
                            ]}
                            onPress={() => {
                                onConfirm();
                                onClose();
                            }}
                        >
                            <Text style={styles.textStyleConfirm}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (colors, theme) => StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalView: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    iconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        marginBottom: 8,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
    },
    modalText: {
        marginBottom: 24,
        textAlign: "center",
        color: theme === 'dark' ? '#aaa' : '#666',
        fontSize: 16,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        borderRadius: 12,
        padding: 14,
        elevation: 2,
        flex: 1,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    buttonConfirm: {
        backgroundColor: colors.primary,
    },
    buttonDestructive: {
        backgroundColor: '#ff6b6b',
    },
    textStyleCancel: {
        color: colors.text,
        fontWeight: "bold",
        textAlign: "center"
    },
    textStyleConfirm: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
});
