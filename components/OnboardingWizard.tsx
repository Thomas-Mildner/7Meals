import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingWizardProps {
    visible: boolean;
    onClose: () => void;
}

const SLIDES = [
    {
        id: '1',
        icon: 'restaurant-outline' as any,
        title: 'Willkommen bei 7Meals',
        description: 'Schluss mit der Frage: "Was essen wir heute?" Deine persönliche Rezeptsammlung trifft auf smarte Wochenplanung.',
        color: '#ff6b6b'
    },
    {
        id: '2',
        icon: 'book-outline' as any,
        title: 'Alles an einem Ort',
        description: 'Speichere deine Lieblingsgerichte, lade Fotos hoch und behalte den Überblick über Zutaten und Zubereitungszeit.',
        color: '#4ecdc4'
    },
    {
        id: '3',
        icon: 'calendar-outline' as any,
        title: 'Entspannte Planung',
        description: 'Plane deine Woche im Voraus. Mit einem Klick weißt du immer, was auf dem Tisch steht.',
        color: '#45b7d1'
    },
    {
        id: '4',
        icon: 'cart-outline' as any,
        title: 'Clever einkaufen',
        description: 'Erstelle ganz einfach eine Einkaufsliste aus den Rezepten deines Wochenplans. (Bald verfügbar!)',
        color: '#f9ca24'
    }
];

export default function OnboardingWizard({ visible, onClose }: OnboardingWizardProps) {
    const { colors, theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        if (activeIndex < SLIDES.length - 1) {
            setActiveIndex(activeIndex + 1);
        } else {
            // Close when done
            setActiveIndex(0);
            onClose();
        }
    };

    const handleSkip = () => {
        setActiveIndex(0);
        onClose();
    };

    if (!visible) return null;

    const currentSlide = SLIDES[activeIndex];

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {Platform.OS !== 'ios' && (
                    <SafeAreaView style={{ backgroundColor: colors.background }} />
                )}
                
                <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.imageContainer}>
                        <LinearGradient
                            colors={[currentSlide.color + '40', currentSlide.color + '10']}
                            style={styles.iconCircle}
                        >
                            <Ionicons name={currentSlide.icon} size={80} color={currentSlide.color} />
                        </LinearGradient>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{currentSlide.title}</Text>
                    <Text style={[styles.description, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
                        {currentSlide.description}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.pagination}>
                        {SLIDES.map((_, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.dot, 
                                    { backgroundColor: index === activeIndex ? colors.primary : (theme === 'dark' ? '#444' : '#ccc') },
                                    index === activeIndex && styles.activeDot
                                ]} 
                            />
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.nextButton, { backgroundColor: colors.primary }]} 
                        onPress={handleNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.nextButtonText}>
                            {activeIndex === SLIDES.length - 1 ? 'Los geht\'s' : 'Weiter'}
                        </Text>
                        <Ionicons 
                            name={activeIndex === SLIDES.length - 1 ? "checkmark" : "arrow-forward"} 
                            size={20} 
                            color="#fff" 
                            style={{marginLeft: 8}} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 24 : 40,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    imageContainer: {
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
    },
    nextButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
