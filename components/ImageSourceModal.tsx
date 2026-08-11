import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ImageSourceModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectSource: (source: 'camera' | 'gallery') => void;
}

export default function ImageSourceModal({ visible, onClose, onSelectSource }: ImageSourceModalProps) {
    const { colors, theme } = useTheme();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <Pressable>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.dragIndicator} />
                        
                        <Text style={[styles.title, { color: colors.text }]}>Foto hinzufügen</Text>
                        
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }]} 
                            onPress={() => onSelectSource('camera')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: colors.text }]}>Foto aufnehmen</Text>
                                <Text style={styles.actionSubtitle}>Kamera öffnen</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }]} 
                            onPress={() => onSelectSource('gallery')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="images-outline" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Text style={[styles.actionTitle, { color: colors.text }]}>Aus Galerie wählen</Text>
                                <Text style={styles.actionSubtitle}>Bestehendes Bild suchen</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#888" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 13,
        color: '#888',
    },
    cancelButton: {
        marginTop: 12,
        padding: 16,
        alignItems: 'center',
        borderRadius: 16,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff6b6b',
    },
});
