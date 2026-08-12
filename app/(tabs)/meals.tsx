import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert, Image, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMeals } from '../../hooks/useMeals';
import { useTheme } from '../../context/ThemeContext';
import AddMealModal from '../../components/AddMealModal';
import EditMealModal from '../../components/EditMealModal';
import ProfileModal from '../../components/ProfileModal';
import FriendMealsModal from '../../components/FriendMealsModal';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadMealImage, deleteMealImage } from '../../services/storage';
import ImageSourceModal from '../../components/ImageSourceModal';
import MealDetailsModal from '../../components/MealDetailsModal';


export default function MealsScreen() {
    const { meals, loading, addMeal, removeMeal, toggleFavorite, toggleShared, editMeal, refreshMeals } = useMeals();
    const { user } = useAuth();
    const { colors, theme } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [friendModalVisible, setFriendModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [uploadingMealId, setUploadingMealId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [imageTargetMeal, setImageTargetMeal] = useState<any>(null);
    const [viewingMealDetails, setViewingMealDetails] = useState<any | null>(null);
    const [isCompactMode, setIsCompactMode] = useState(false);

    // Dynamic Styles
    const styles = getStyles(colors, theme);

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            default: return cat;
        }
    };

    const handleTakeImage = (meal: any) => {
        const isDesktopWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && !/Mobi|Android|iPhone/i.test(navigator.userAgent);
        
        if (isDesktopWeb) {
            executeImageSelection('gallery', meal);
        } else {
            setImageTargetMeal(meal);
            setImageModalVisible(true);
        }
    };

    const handleImageSourceSelected = (source: 'camera' | 'gallery') => {
        executeImageSelection(source, imageTargetMeal);
    };

    const executeImageSelection = async (source: 'camera' | 'gallery', targetMeal: any) => {
        setImageModalVisible(false);
        if (!targetMeal) return;

        try {
            let result;
            
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Berechtigung fehlt', 'Wir benötigen Kamerazugriff, um Bilder aufzunehmen.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 0.5,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Berechtigung fehlt', 'Wir benötigen Zugriff auf deine Galerie.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 0.5,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setUploadingMealId(targetMeal.id);
                try {
                    const imageUrl = await uploadMealImage(targetMeal.id, result.assets[0].uri);
                    await editMeal(targetMeal.id, { imageUrl });
                } catch (e: any) {
                    console.error(e);
                    Alert.alert('Fehler', 'Das Bild konnte nicht hochgeladen werden.');
                } finally {
                    setUploadingMealId(null);
                }
            }
        } catch (e) {
            console.error("Error launching image picker", e);
        } finally {
            setImageTargetMeal(null);
        }
    };

    const handleDeleteImage = (meal: any) => {
        const executeDelete = async () => {
            try {
                // Optimistically remove from UI or wait for editMeal
                await deleteMealImage(meal.id);
                await editMeal(meal.id, { imageUrl: null });
            } catch (e) {
                console.error(e);
                // Even if storage deletion fails (e.g. already deleted), we remove it from Firestore
                await editMeal(meal.id, { imageUrl: null });
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Möchtest du dieses Bild wirklich löschen?')) {
                executeDelete();
            }
        } else {
            Alert.alert(
                'Bild löschen',
                'Möchtest du dieses Bild wirklich löschen?',
                [
                    { text: 'Abbrechen', style: 'cancel' },
                    { text: 'Löschen', style: 'destructive', onPress: executeDelete }
                ]
            );
        }
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setViewingMealDetails(item)}
            style={{ marginBottom: 16 }}
        >
            <LinearGradient
                colors={[colors.card, theme === 'dark' ? '#2a2a2a' : '#e6e6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.mealCard, { marginBottom: 0 }]}
            >
            {/* <View style={[styles.categoryStrip, { backgroundColor: Colors[item.category] }]} /> - Removing single color strip */}
            <View style={[styles.categoryStrip, { backgroundColor: theme === 'dark' ? '#444' : '#ddd' }]} />

            <View style={styles.mealContent}>
                <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{item.name}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => { setEditingMeal(item); setEditModalVisible(true); }} hitSlop={10} style={{ marginRight: 10 }}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleTakeImage(item)} hitSlop={10} style={{ marginRight: 10 }}>
                            <Ionicons name="camera-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            if (user?.isAnonymous || !user?.email) {
                                Alert.alert('Login erforderlich', 'Um Gerichte zu teilen, musst du mit einer E-Mail-Adresse angemeldet sein.');
                                return;
                            }
                            toggleShared(item.id, !item.isShared);
                        }} hitSlop={10} style={{ marginRight: 10 }}>
                            <Ionicons name={item.isShared ? "share-social" : "share-social-outline"} size={20} color={item.isShared ? colors.primary : "#666"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleFavorite(item.id, !item.isFavorite)} hitSlop={10} style={{ marginRight: 10 }}>
                            <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={22} color={item.isFavorite ? "#ff6b6b" : "#666"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMeal(item.id)} hitSlop={10}>
                            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {!isCompactMode && item.description ? (
                    <Text style={styles.mealDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {uploadingMealId === item.id ? (
                    <View style={styles.imageLoadingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.imageLoadingText}>Wird hochgeladen...</Text>
                    </View>
                ) : !isCompactMode && item.imageUrl ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.imageUrl }} style={styles.mealImage} resizeMode="cover" />
                        <TouchableOpacity 
                            style={styles.deleteImageButton} 
                            onPress={() => handleDeleteImage(item)}
                        >
                            <Ionicons name="close-circle" size={24} color="rgba(255, 255, 255, 0.9)" />
                        </TouchableOpacity>
                    </View>
                ) : null}

                {item.lastEaten && (
                    <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                        Zuletzt: {new Date(item.lastEaten).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Text>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {item.categories && Array.isArray(item.categories) && item.categories.map((cat: string) => (
                        <View key={cat} style={[styles.categoryBadge, { backgroundColor: (colors as any)[cat] + '20' }]}>
                            <Text style={[styles.categoryText, { color: (colors as any)[cat] }]}>
                                {getCategoryLabel(cat)}
                            </Text>
                        </View>
                    ))}
                    
                    {item.duration && (
                        <View style={styles.metaBadge}>
                            <Ionicons name="time-outline" size={12} color={colors.text} style={{marginRight: 4}} />
                            <Text style={[styles.categoryText, { color: colors.text }]}>{item.duration} Min</Text>
                        </View>
                    )}
                    
                    {item.difficulty && (
                        <View style={styles.metaBadge}>
                            <Ionicons name="bar-chart-outline" size={12} color={colors.text} style={{marginRight: 4}} />
                            <Text style={[styles.categoryText, { color: colors.text }]}>
                                {item.difficulty === 'easy' ? 'Leicht' : item.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    // Prepare Sections (Safe filtering)
    const filteredMeals = meals.filter(m => {
        const query = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(query);
        const matchIngredient = m.ingredients?.some(ing => ing.toLowerCase().includes(query));
        return matchName || matchIngredient;
    });
    
    const sections = [
        { title: 'FLEISCH', data: filteredMeals.filter(m => m.categories && Array.isArray(m.categories) && m.categories.includes('meat')), key: 'meat', color: colors.meat },
        { title: 'FISCH', data: filteredMeals.filter(m => m.categories && Array.isArray(m.categories) && m.categories.includes('fish')), key: 'fish', color: colors.fish },
        { title: 'VEGGIE', data: filteredMeals.filter(m => m.categories && Array.isArray(m.categories) && m.categories.includes('veg')), key: 'veg', color: colors.veg },
    ];

    // Filter out empty sections if desired, or keep to show empty state per section?
    // User probably wants to see all categories. But we can hide empty ones to be cleaner.
    // Let's keep them hidden if empty for cleaner UI, or show all. User specified "Group the meals". 
    // Usually SectionList only renders headers for data.
    const notEmptySections = sections.filter(s => s.data.length > 0);

    const renderSectionHeader = ({ section: { title, color } }: { section: { title: string, color: string } }) => (
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIndicator, { backgroundColor: color }]} />
            <Text style={[styles.sectionTitle, { color: color }]}>{title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.subtitle}>Verwalte deine</Text>
                    <Text style={styles.title}>Sammlung</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => setIsCompactMode(!isCompactMode)}
                    >
                        <Ionicons name={isCompactMode ? "image-outline" : "list"} size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => setFriendModalVisible(true)}
                    >
                        <Ionicons name="people-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, styles.addButton]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={26} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onPress={() => setProfileModalVisible(true)}
                    >
                        <Ionicons name="person-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="Gerichte durchsuchen..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
            </View>

            {user?.isAnonymous && (
                <View style={styles.demoBanner}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.demoBannerText}>
                        Demo Zugang: Daten werden nicht gespeichert.
                    </Text>
                </View>
            )}

            {loading && meals.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Lade Gerichte...</Text>
                </View>
            ) : (
                <SectionList
                    sections={notEmptySections}
                    keyExtractor={(item, index) => item.id + '-' + index}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    extraData={meals}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="restaurant-outline" size={60} color={colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>Noch keine Gerichte</Text>
                            <Text style={styles.emptyText}>
                                Füge deine Lieblingsgerichte hinzu oder tippe auf das Schraubenschlüssel-Symbol für Beispieldaten.
                            </Text>
                        </View>
                    }
                    stickySectionHeadersEnabled={false}
                />
            )}

            <AddMealModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onAdd={addMeal}
            />
            <ProfileModal
                visible={profileModalVisible}
                onClose={() => setProfileModalVisible(false)}
            />
            <FriendMealsModal
                visible={friendModalVisible}
                onClose={() => setFriendModalVisible(false)}
            />
            <EditMealModal
                visible={editModalVisible}
                onClose={() => { setEditModalVisible(false); setEditingMeal(null); }}
                onSave={editMeal}
                meal={editingMeal}
            />
            <ImageSourceModal
                visible={imageModalVisible}
                onClose={() => {
                    setImageModalVisible(false);
                    setImageTargetMeal(null);
                }}
                onSelectSource={handleImageSourceSelected}
            />
            <MealDetailsModal
                visible={!!viewingMealDetails}
                meal={viewingMealDetails}
                onClose={() => setViewingMealDetails(null)}
            />
        </View>
    );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 4,
        fontWeight: '500',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(128,128,128,0.08)',
        marginHorizontal: 24,
        marginBottom: 24,
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.1)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        height: '100%',
    },
    seedButton: {
        backgroundColor: '#4a5568',
    },
    addButton: {
        backgroundColor: colors.primary,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    mealCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryStrip: {
        width: 6,
        height: '100%',
    },
    mealContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
        marginRight: 10,
    },
    mealDescription: {
        fontSize: 13,
        color: '#999',
        marginBottom: 8,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(128,128,128,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    mealImage: {
        width: '100%',
        height: 150,
        borderRadius: 12,
    },
    deleteImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 12,
        zIndex: 10,
        elevation: 10,
        padding: 4,
    },
    imageLoadingContainer: {
        width: '100%',
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        marginBottom: 12,
    },
    imageLoadingText: {
        marginTop: 8,
        fontSize: 12,
        color: '#888',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#888',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(42, 157, 143, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 8,
        marginTop: 10,
    },
    sectionIndicator: {
        width: 4,
        height: 16,
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    demoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '15',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    demoBannerText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});
