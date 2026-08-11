import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Image, Platform } from 'react-native';
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

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function PlanScreen() {
    const { plan, startDate, config, updateConfig, generatePlan, swapMeal, updatePlanMeal, clearPlan, toggleMealEaten } = useMealPlan();
    const { meals, editMeal } = useMeals();
    const { colors, theme } = useTheme();
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isConfigExpanded, setIsConfigExpanded] = useState(true);
    const [uploadingMealId, setUploadingMealId] = useState<string | null>(null);

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

    const handleTakeImage = async (meal: any, index: number) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Berechtigung fehlt', 'Wir benötigen Kamerazugriff, um Bilder aufzunehmen.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUploadingMealId(meal.id);
            try {
                const imageUrl = await uploadMealImage(meal.id, result.assets[0].uri);
                await editMeal(meal.id, { imageUrl });
                await updatePlanMeal(index, { imageUrl });
                Alert.alert('Erfolg', 'Bild wurde hochgeladen!');
            } catch (e: any) {
                console.error(e);
                Alert.alert('Fehler', 'Das Bild konnte nicht hochgeladen werden. Stelle sicher, dass du in Firebase angemeldet bist und die Berechtigungen (Storage Rules) stimmen.');
            } finally {
                setUploadingMealId(null);
            }
        }
    };

    const handleDeleteImage = (meal: any, index: number) => {
        const executeDelete = async () => {
            try {
                await deleteMealImage(meal.id);
                await editMeal(meal.id, { imageUrl: null });
                await updatePlanMeal(index, { imageUrl: undefined });
            } catch (e) {
                console.error(e);
                await editMeal(meal.id, { imageUrl: null });
                await updatePlanMeal(index, { imageUrl: undefined });
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

    const renderDayItem = ({ item, index }: { item: any, index: number }) => {
        // Use the eaten state directly from the plan slot
        const isEaten = !!item.isEaten;

        // Calculate date for this day box
        let dateLabel = "";
        if (startDate) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + index);
            dateLabel = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        }

        return (
            <LinearGradient
                colors={[colors.card, theme === 'dark' ? '#2a2a2a' : '#e6e6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dayCard}
            >
                <View style={styles.dayHeader}>
                    <View>
                        <Text style={styles.dayName}>{DAYS[index]}</Text>
                        {startDate && <Text style={{ color: '#888', fontSize: 12 }}>{dateLabel}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => toggleMealEaten(index)}
                            style={[
                                styles.eatenButton,
                                isEaten ? styles.eatenButtonActive : styles.eatenButtonInactive
                            ]}
                        >
                            <Ionicons
                                name={isEaten ? "checkmark-circle" : "ellipse-outline"}
                                size={18}
                                color={isEaten ? "#fff" : "#888"}
                            />
                            <Text style={[
                                styles.eatenButtonText,
                                { color: isEaten ? "#fff" : "#888" }
                            ]}>
                                {isEaten ? "Gegessen" : "Essen"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => swapMeal(index)} hitSlop={10}>
                            <Ionicons name="refresh-circle" size={28} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.mealContent, { borderColor: (item.categories && Array.isArray(item.categories) && item.categories.length > 0) ? colors[item.categories[0]] : '#444' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.mealName}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => handleTakeImage(item, index)} hitSlop={10} style={{ marginRight: 8 }}>
                                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            {item.isFavorite && <Ionicons name="heart" size={16} color="#ff6b6b" />}
                        </View>
                    </View>

                    {uploadingMealId === item.id ? (
                        <View style={styles.imageLoadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.imageLoadingText}>Wird hochgeladen...</Text>
                        </View>
                    ) : item.imageUrl ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: item.imageUrl }} style={styles.mealImage} resizeMode="cover" />
                            <TouchableOpacity
                                style={styles.deleteImageButton}
                                onPress={() => handleDeleteImage(item, index)}
                            >
                                <Ionicons name="close-circle" size={24} color="rgba(255, 255, 255, 0.9)" />
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: 4 }}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {item.categories && Array.isArray(item.categories) && item.categories.map((cat: string) => (
                                <View key={cat} style={[styles.categoryBadge, { backgroundColor: colors[cat] + '20' }]}>
                                    <Text style={[styles.categoryText, { color: colors[cat] }]}>
                                        {getCategoryLabel(cat)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
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
                onConfirm={clearPlan}
                title="Plan löschen"
                message="Möchtest du den aktuellen Plan wirklich löschen?"
                confirmText="Löschen"
                type="destructive"
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
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        paddingBottom: 8,
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
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
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
