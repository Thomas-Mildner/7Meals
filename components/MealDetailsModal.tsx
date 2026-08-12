import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Meal } from '../types';
import ImageViewerModal from './ImageViewerModal';

interface MealDetailsModalProps {
    visible: boolean;
    meal: Meal | null;
    onClose: () => void;
}

export default function MealDetailsModal({ visible, meal, onClose }: MealDetailsModalProps) {
    const { colors, theme } = useTheme();
    const [viewingImage, setViewingImage] = React.useState<boolean>(false);

    if (!meal) return null;

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            case 'brotzeit': return 'BROTZEIT';
            default: return cat;
        }
    };

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {Platform.OS !== 'ios' && (
                    <SafeAreaView style={{ backgroundColor: colors.card }} />
                )}
                
                <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header Image */}
                    {meal.imageUrl ? (
                        <View style={styles.imageHeader}>
                            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewingImage(true)} style={{ flex: 1 }}>
                                <Image source={{ uri: meal.imageUrl }} style={styles.headerImage} resizeMode="cover" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closeButtonOverlay} onPress={onClose}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.noImageHeader, { backgroundColor: colors.card }]}>
                            <TouchableOpacity style={styles.closeButtonPlain} onPress={onClose}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.content}>
                        {/* Title & Categories */}
                        <Text style={[styles.title, { color: colors.text }]}>{meal.name}</Text>
                        
                        <View style={styles.tagsRow}>
                            {meal.categories && Array.isArray(meal.categories) && meal.categories.map((cat: string) => (
                                <View key={cat} style={[styles.categoryBadge, { backgroundColor: (colors as any)[cat] + '20' }]}>
                                    <Text style={[styles.categoryText, { color: (colors as any)[cat] }]}>
                                        {getCategoryLabel(cat)}
                                    </Text>
                                </View>
                            ))}

                            {meal.duration && (
                                <View style={styles.metaBadge}>
                                    <Ionicons name="time-outline" size={14} color={colors.text} style={{marginRight: 4}} />
                                    <Text style={[styles.metaText, { color: colors.text }]}>{meal.duration} Min</Text>
                                </View>
                            )}
                            
                            {meal.difficulty && (
                                <View style={styles.metaBadge}>
                                    <Ionicons name="bar-chart-outline" size={14} color={colors.text} style={{marginRight: 4}} />
                                    <Text style={[styles.metaText, { color: colors.text }]}>
                                        {meal.difficulty === 'easy' ? 'Leicht' : meal.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Description */}
                        {meal.description ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Beschreibung</Text>
                                <Text style={[styles.descriptionText, { color: theme === 'dark' ? '#ccc' : '#555' }]}>
                                    {meal.description}
                                </Text>
                            </View>
                        ) : null}

                        {/* Ingredients */}
                        {meal.ingredients && meal.ingredients.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Zutaten</Text>
                                <View style={[styles.ingredientsContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f9f9f9' }]}>
                                    {meal.ingredients.map((ingredient, idx) => (
                                        <View key={idx} style={styles.ingredientRow}>
                                            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                                            <Text style={[styles.ingredientText, { color: colors.text }]}>
                                                {ingredient}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Zutaten</Text>
                                <Text style={[styles.emptyText, { color: '#888' }]}>Keine Zutaten hinterlegt.</Text>
                            </View>
                        )}
                        
                        {meal.lastEaten && (
                            <View style={[styles.lastEatenCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : colors.primary + '15' }]}>
                                <View style={[styles.lastEatenIconContainer, { backgroundColor: colors.primary + '30' }]}>
                                    <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.lastEatenSubtitle, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
                                        Zuletzt gegessen
                                    </Text>
                                    <Text style={[styles.lastEatenTitle, { color: colors.text }]}>
                                        {new Date(meal.lastEaten).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
            <ImageViewerModal 
                visible={viewingImage} 
                imageUrl={meal.imageUrl || null} 
                onClose={() => setViewingImage(false)} 
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageHeader: {
        width: '100%',
        height: 300,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    closeButtonOverlay: {
        position: 'absolute',
        top: 24,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    noImageHeader: {
        width: '100%',
        paddingTop: 16,
        paddingRight: 16,
        alignItems: 'flex-end',
        zIndex: 10,
    },
    closeButtonPlain: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(128,128,128,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(128,128,128,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
    },
    ingredientsContainer: {
        borderRadius: 16,
        padding: 16,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
        marginRight: 12,
    },
    ingredientText: {
        fontSize: 16,
        lineHeight: 22,
        flex: 1,
    },
    emptyText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
    lastEatenCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
    },
    lastEatenIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    lastEatenSubtitle: {
        fontSize: 13,
        marginBottom: 2,
    },
    lastEatenTitle: {
        fontSize: 16,
        fontWeight: '600',
    }
});
