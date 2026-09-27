import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useMeals } from '../../hooks/useMeals';
import ProfileModal from '../../components/ProfileModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadMealImage, deleteMealImage } from '../../services/storage';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import ImageSourceModal from '../../components/ImageSourceModal';
import MealDetailsModal from '../../components/MealDetailsModal';
import { DaySlot, DayPlan } from '../../types';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function PlanScreen() {
    const { plan, startDate, config, updateConfig, generatePlan, swapMeal, updatePlanMeal, clearPlan, toggleMealEaten } = useMealPlan();
    const { meals, editMeal } = useMeals();
    const { colors, theme } = useTheme();
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isConfigExpanded, setIsConfigExpanded] = useState(true);
    const [uploadingMealId, setUploadingMealId] = useState<string | null>(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [imageTarget, setImageTarget] = useState<{meal: any, index: number, slot: DaySlot} | null>(null);
    const [viewingMealDetails, setViewingMealDetails] = useState<any | null>(null);

    useEffect(() => {
        // Automatically collapse configuration if a plan exists
        if (plan.length > 0) {
            setIsConfigExpanded(false);
        } else {
            setIsConfigExpanded(true);
        }
    }, [plan.length === 0]); // Re-expand only when plan is cleared

    const totalDays = config.meat + config.fish + config.veg + config.brotzeit;

    // Dynamic Styles
    const styles = getStyles(colors, theme);

    const handleGenerate = () => {
        if (meals.length === 0) {
            Alert.alert("Keine Gerichte", "Bitte füge zuerst Gerichte im Reiter 'Gerichte' hinzu!");
            return;
        }
        if (totalDays !== 7) {
            Alert.alert("Ungültige Konfiguration", `Gesamtzahl der Tage muss 7 sein. Aktuell: ${totalDays}`);
            return;
        }
        generatePlan().then(result => {
            if (result) {
                if (result.warnings && result.warnings.length > 0) {
                    Alert.alert("Hinweis", result.warnings.join('\n'));
                } else if (result.hasDuplicates) {
                    Alert.alert(
                        "Hinweis",
                        "Einige Gerichte kommen mehrfach vor, da nicht genügend passende Gerichte verfügbar waren."
                    );
                }
            }
        });
    };

    const handleClear = () => {
        setShowClearConfirm(true);
    }

    const renderConfigCounter = (label: string, type: 'meat' | 'fish' | 'veg' | 'brotzeit') => (
        <View style={styles.counterContainer}>
            <Text style={[styles.counterLabel, { color: colors[type] }]}>{label}</Text>
            <View style={styles.counterControls}>
                <TouchableOpacity
                    onPress={() => updateConfig(type, Math.max(0, config[type] - 1))}
                    style={styles.counterButton}
                >
                    <Ionicons name="remove" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{config[type]}</Text>
                <TouchableOpacity
                    onPress={() => updateConfig(type, config[type] + 1)}
                    style={styles.counterButton}
                >
                    <Ionicons name="add" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            case 'brotzeit': return 'BROTZEIT';
            default: return cat;
        }
    };

    const handleTakeImage = (meal: any, index: number, slot: DaySlot) => {
        const isDesktopWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && !/Mobi|Android|iPhone/i.test(navigator.userAgent);
        
        if (isDesktopWeb) {
            executeImageSelection('gallery', meal, index, slot);
        } else {
            setImageTarget({ meal, index, slot });
            setImageModalVisible(true);
        }
    };

    const handleImageSourceSelected = (source: 'camera' | 'gallery') => {
        if (imageTarget) {
            executeImageSelection(source, imageTarget.meal, imageTarget.index, imageTarget.slot);
        }
    };

    const executeImageSelection = async (source: 'camera' | 'gallery', targetMeal: any, index: number, slot: DaySlot) => {
        setImageModalVisible(false);

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
                    await updatePlanMeal(index, slot, { imageUrl });
                    Alert.alert('Erfolg', 'Bild wurde hochgeladen!');
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
            setImageTarget(null);
        }
    };

    const handleDeleteImage = (meal: any, index: number, slot: DaySlot) => {
        const executeDelete = async () => {
            try {
                await deleteMealImage(meal.id);
                await editMeal(meal.id, { imageUrl: null });
                await updatePlanMeal(index, slot, { imageUrl: undefined });
            } catch (e) {
                console.error(e);
                await editMeal(meal.id, { imageUrl: null });
                await updatePlanMeal(index, slot, { imageUrl: undefined });
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

    const renderMealSlot = (
        title: string,
        slot: DaySlot,
        mealItem: any,
        dayIndex: number,
        iconName: any,
        isLeftover = false
    ) => {
        if (!mealItem) return null;
        const isEaten = !!mealItem.isEaten;
        const isPlaceholder = mealItem.id?.startsWith('placeholder-') || mealItem.id?.startsWith('leftover-');

        const slotColor = slot === 'breakfast'
            ? '#E9C46A'
            : slot === 'dinner'
                ? colors.primary
                : colors.fish;

        return (
            <View style={styles.slotContainer}>
                <View style={styles.slotHeader}>
                    <View style={styles.slotTitleRow}>
                        <Ionicons name={iconName} size={15} color={slotColor} style={{ marginRight: 6 }} />
                        <Text style={[styles.slotTitle, { color: slotColor }]}>{title}</Text>
                        {isLeftover && (
                            <View style={styles.leftoverBadge}>
                                <Ionicons name="repeat-outline" size={11} color={colors.primary} style={{ marginRight: 3 }} />
                                <Text style={styles.leftoverBadgeText}>Reste vom Vortag</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.slotActions}>
                        <TouchableOpacity
                            onPress={() => toggleMealEaten(dayIndex, slot)}
                            style={[
                                styles.eatenButtonCompact,
                                isEaten ? styles.eatenButtonActive : styles.eatenButtonInactive
                            ]}
                        >
                            <Ionicons
                                name={isEaten ? "checkmark-circle" : "ellipse-outline"}
                                size={14}
                                color={isEaten ? "#fff" : "#888"}
                            />
                            <Text style={[
                                styles.eatenButtonTextCompact,
                                { color: isEaten ? "#fff" : "#888" }
                            ]}>
                                {isEaten ? "Gegessen" : "Essen"}
                            </Text>
                        </TouchableOpacity>

                        {!isLeftover && (
                            <TouchableOpacity onPress={() => swapMeal(dayIndex, slot)} hitSlop={8}>
                                <Ionicons name="refresh-circle" size={24} color={colors.primary} />
                            </TouchableOpacity>
                        )}

                        {!isPlaceholder && (
                            <TouchableOpacity onPress={() => handleTakeImage(mealItem, dayIndex, slot)} hitSlop={8}>
                                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={isPlaceholder ? 1 : 0.8}
                    onPress={() => !isPlaceholder && setViewingMealDetails(mealItem)}
                >
                    <View style={[
                        styles.mealContent,
                        { borderColor: (mealItem.categories && Array.isArray(mealItem.categories) && mealItem.categories.length > 0) ? ((colors as any)[mealItem.categories[0]] || slotColor) : slotColor }
                    ]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.mealName, isPlaceholder && { fontStyle: 'italic', color: '#888' }]}>
                                {mealItem.name}
                            </Text>
                            {mealItem.isFavorite && <Ionicons name="heart" size={14} color="#ff6b6b" />}
                        </View>

                        {uploadingMealId === mealItem.id ? (
                            <View style={styles.imageLoadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.imageLoadingText}>Wird hochgeladen...</Text>
                            </View>
                        ) : mealItem.imageUrl ? (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: mealItem.imageUrl }}
                                    style={styles.mealImage}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                                <TouchableOpacity
                                    style={styles.deleteImageButton}
                                    onPress={() => handleDeleteImage(mealItem, dayIndex, slot)}
                                >
                                    <Ionicons name="close-circle" size={22} color="rgba(255, 255, 255, 0.9)" />
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {mealItem.categories && Array.isArray(mealItem.categories) && mealItem.categories.map((cat: string) => (
                                <View key={cat} style={[styles.categoryBadge, { backgroundColor: ((colors as any)[cat] || colors.primary) + '20' }]}>
                                    <Text style={[styles.categoryText, { color: (colors as any)[cat] || colors.primary }]}>
                                        {getCategoryLabel(cat)}
                                    </Text>
                                </View>
                            ))}
                            {mealItem.duration && (
                                <View style={[styles.categoryBadge, { backgroundColor: 'rgba(128,128,128,0.1)', flexDirection: 'row', alignItems: 'center' }]}>
                                    <Ionicons name="time-outline" size={11} color={colors.text} style={{ marginRight: 3 }} />
                                    <Text style={[styles.categoryText, { color: colors.text }]}>{mealItem.duration}m</Text>
                                </View>
                            )}
                            {mealItem.difficulty && (
                                <View style={styles.metaBadge}>
                                    <Ionicons name="bar-chart-outline" size={11} color={colors.text} style={{ marginRight: 3 }} />
                                    <Text style={[styles.categoryText, { color: colors.text }]}>
                                        {mealItem.difficulty === 'easy' ? 'Leicht' : mealItem.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const renderDayItem = ({ item, index }: { item: any, index: number }) => {
        let dateLabel = "";
        if (startDate) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + index);
            dateLabel = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        }

        const dayPlan: DayPlan = (item && ('breakfast' in item || 'dinner' in item)) ? item : {
            breakfast: { id: `bf-${index}`, name: 'Frühstück auswählen', categories: ['veg'], isFavorite: false, userId: '', ownerEmail: '', isShared: false, description: '', isEaten: false },
            lunch: { id: `ln-${index}`, name: 'Reste vom Vortag', categories: ['brotzeit'], isFavorite: false, userId: '', ownerEmail: '', isShared: false, description: '', isEaten: false },
            dinner: item || { id: `dn-${index}`, name: 'Gericht auswählen', categories: ['veg'], isFavorite: false, userId: '', ownerEmail: '', isShared: false, description: '', isEaten: false }
        };

        return (
            <LinearGradient
                colors={[colors.card, theme === 'dark' ? '#2a2a2a' : '#e6e6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dayCard}
            >
                <View style={styles.dayHeader}>
                    <View>
                        <Text style={styles.dayName}>{dayPlan.dayName || DAYS[index]}</Text>
                        {startDate && <Text style={{ color: '#888', fontSize: 12 }}>{dateLabel}</Text>}
                    </View>
                </View>

                {renderMealSlot('FRÜHSTÜCK', 'breakfast', dayPlan.breakfast, index, 'cafe-outline')}
                <View style={styles.slotDivider} />
                {renderMealSlot('MITTAGESSEN', 'lunch', dayPlan.lunch, index, 'restaurant-outline', true)}
                <View style={styles.slotDivider} />
                {renderMealSlot('ABENDESSEN', 'dinner', dayPlan.dinner, index, 'moon-outline')}
            </LinearGradient>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Wochenplan</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    {plan.length > 0 && (
                        <TouchableOpacity onPress={handleClear}>
                            <Text style={styles.clearText}>Löschen</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' } as any]}
                        onPress={() => setProfileModalVisible(true)}
                    >
                        <Ionicons name="person-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.configSection}>
                <TouchableOpacity
                    style={styles.configHeader}
                    onPress={() => setIsConfigExpanded(!isConfigExpanded)}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="settings-outline" size={20} color={colors.primary} />
                        <Text style={styles.configTitle}>Konfiguration</Text>
                    </View>
                    <Ionicons
                        name={isConfigExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.text}
                    />
                </TouchableOpacity>

                {isConfigExpanded && (
                    <View style={styles.configContent}>
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>Ausgewählte Tage: {totalDays}/7</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${(totalDays / 7) * 100}%`, backgroundColor: totalDays === 7 ? colors.primary : '#ff9f43' }]} />
                            </View>
                        </View>

                        <View style={styles.countersRow}>
                            {renderConfigCounter('Fleisch', 'meat')}
                            {renderConfigCounter('Fisch', 'fish')}
                            {renderConfigCounter('Veggie', 'veg')}
                            {renderConfigCounter('Brotzeit', 'brotzeit')}
                        </View>

                        <View style={styles.timeLimitContainer}>
                            <Text style={[styles.counterLabel, { color: colors.text }]}>Max. Zeit pro Mahlzeit</Text>
                            <View style={styles.timeLimitOptions}>
                                {[
                                    { label: 'Egal', value: 0 },
                                    { label: '30 Min', value: 30 },
                                    { label: '45 Min', value: 45 },
                                    { label: '60 Min', value: 60 }
                                ].map(option => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.timeOptionButton,
                                            config.maxTime === option.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => updateConfig('maxTime', option.value)}
                                    >
                                        <Text style={[
                                            styles.timeOptionText,
                                            config.maxTime === option.value && { color: '#fff' }
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.generateButton, totalDays !== 7 && styles.disabledButton]}
                            onPress={handleGenerate}
                            disabled={totalDays !== 7}
                        >
                            <Text style={styles.generateButtonText}>
                                {plan.length > 0 ? "Plan neu erstellen" : "Plan erstellen"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <FlatList
                data={plan}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderDayItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-clear-outline" size={80} color="#333" />
                        <Text style={styles.emptyTitle}>Kein aktiver Plan</Text>
                        <Text style={styles.emptyText}>Konfiguriere deine Vorlieben oben und klicke auf Erstellen!</Text>
                    </View>
                }
            />
            < ProfileModal
                visible={profileModalVisible}
                onClose={() => setProfileModalVisible(false)}
            />
            <ConfirmModal
                visible={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={async () => {
                    await clearPlan();
                    setShowClearConfirm(false);
                }}
                title="Wochenplan löschen"
                message="Möchtest du den gesamten Wochenplan wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                confirmText="Ja, löschen"
                cancelText="Abbrechen"
            />
            <ImageSourceModal
                visible={imageModalVisible}
                onClose={() => {
                    setImageModalVisible(false);
                    setImageTarget(null);
                }}
                onSelectSource={handleImageSourceSelected}
            />
            <MealDetailsModal
                visible={!!viewingMealDetails}
                meal={viewingMealDetails}
                onClose={() => setViewingMealDetails(null)}
            />
        </View >
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
        alignItems: 'baseline',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: colors.text,
    },
    clearText: {
        color: '#ff6b6b',
        fontSize: 16,
        fontWeight: '600',
    },
    configSection: {
        margin: 20,
        marginTop: 10,
        backgroundColor: colors.card,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
    },
    configHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    configTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },

    configContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressText: {
        color: '#888',
        marginBottom: 8,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: theme === 'dark' ? '#333' : '#eee',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    countersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 10,
    },
    counterContainer: {
        alignItems: 'center',
        width: '47%', // 2 columns with some gap
        marginBottom: 10,
    },
    counterLabel: {
        fontWeight: '700',
        marginBottom: 8,
        fontSize: 14,
    },
    timeLimitContainer: {
        marginBottom: 20,
    },
    timeLimitOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    timeOptionButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 10,
        paddingVertical: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    timeOptionText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
    },
    counterButton: {
        padding: 8,
    },
    counterValue: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
    generateButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledButton: {
        opacity: 0.5,
        shadowOpacity: 0,
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Increased for mobile nav bars
    },
    dayCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        paddingBottom: 6,
    },
    slotContainer: {
        marginVertical: 4,
    },
    slotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    slotTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    slotTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    leftoverBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 6,
    },
    leftoverBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
    },
    slotActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    slotDivider: {
        height: 1,
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        marginVertical: 10,
    },
    eatenButtonCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 7,
        borderRadius: 12,
        borderWidth: 1,
        gap: 4,
    },
    eatenButtonTextCompact: {
        fontSize: 10,
        fontWeight: '600',
    },
    eatenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6
    },
    eatenButtonInactive: {
        borderColor: '#888',
        backgroundColor: 'transparent',
    },
    eatenButtonActive: {
        borderColor: '#4cd137',
        backgroundColor: '#4cd137',
    },
    eatenButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dayName: {
        color: '#888',
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mealContent: {
        borderLeftWidth: 4,
        paddingLeft: 12,
        justifyContent: 'center',
    },
    mealName: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    mealImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 10,
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
        borderRadius: 8,
        marginBottom: 10,
    },
    imageLoadingText: {
        marginTop: 8,
        fontSize: 12,
        color: '#888',
    },
    categoryBadge: {
        paddingHorizontal: 8,
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
        fontSize: 10,
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 15,
        paddingHorizontal: 40,
    },
});
