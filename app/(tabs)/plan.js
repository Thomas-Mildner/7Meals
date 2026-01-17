import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlan } from '../../hooks/useMealPlan';
import { Colors } from '../../constants/Colors';
import { useMeals } from '../../hooks/useMeals';
import ProfileModal from '../../components/ProfileModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useState } from 'react';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function PlanScreen() {
    const { plan, startDate, config, updateConfig, generatePlan, swapMeal, clearPlan } = useMealPlan();
    const { meals, markAsEaten } = useMeals();
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const totalDays = config.meat + config.fish + config.veg + config.brotzeit;

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
            if (result && result.hasDuplicates) {
                Alert.alert(
                    "Hinweis",
                    "Einige Gerichte kommen mehrfach vor, da nicht genügend passende Gerichte verfügbar waren."
                );
            }
        });
    };

    const handleClear = () => {
        setShowClearConfirm(true);
    }

    const renderConfigCounter = (label, type) => (
        <View style={styles.counterContainer}>
            <Text style={[styles.counterLabel, { color: Colors[type] }]}>{label}</Text>
            <View style={styles.counterControls}>
                <TouchableOpacity
                    onPress={() => updateConfig(type, Math.max(0, config[type] - 1))}
                    style={styles.counterButton}
                >
                    <Ionicons name="remove" size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{config[type]}</Text>
                <TouchableOpacity
                    onPress={() => updateConfig(type, config[type] + 1)}
                    style={styles.counterButton}
                >
                    <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const getCategoryLabel = (cat) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            case 'brotzeit': return 'BROTZEIT';
            default: return cat;
        }
    };

    const renderDayItem = ({ item, index }) => {
        // Find the live meal object to get reactive updates
        const liveMeal = meals.find(m => m.id === item.id) || item;

        // Simple heuristic: if eaten today, show check
        const isEatenToday = liveMeal.lastEaten && new Date(liveMeal.lastEaten).toDateString() === new Date().toDateString();

        // Calculate date for this day box
        let dateLabel = "";
        if (startDate) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + index);
            dateLabel = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        }

        return (
            <LinearGradient
                colors={[Colors.card, '#2a2a2a']}
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
                            onPress={() => markAsEaten(item.id)}
                            style={[
                                styles.eatenButton,
                                isEatenToday ? styles.eatenButtonActive : styles.eatenButtonInactive
                            ]}
                        >
                            <Ionicons
                                name={isEatenToday ? "checkmark-circle" : "ellipse-outline"}
                                size={18}
                                color={isEatenToday ? "#fff" : "#888"}
                            />
                            <Text style={[
                                styles.eatenButtonText,
                                { color: isEatenToday ? "#fff" : "#888" }
                            ]}>
                                {isEatenToday ? "Gegessen" : "Essen"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => swapMeal(index)} hitSlop={10}>
                            <Ionicons name="refresh-circle" size={28} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.mealContent, { borderColor: (item.categories && Array.isArray(item.categories) && item.categories.length > 0) ? Colors[item.categories[0]] : '#444' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.mealName}>{item.name}</Text>
                        {item.isFavorite && <Ionicons name="heart" size={16} color="#ff6b6b" style={{ marginBottom: 6 }} />}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            {item.categories && Array.isArray(item.categories) && item.categories.map(cat => (
                                <View key={cat} style={[styles.categoryBadge, { backgroundColor: Colors[cat] + '20' }]}>
                                    <Text style={[styles.categoryText, { color: Colors[cat] }]}>
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
                        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.1)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }]}
                        onPress={() => setProfileModalVisible(true)}
                    >
                        <Ionicons name="person-outline" size={20} color={Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.configSection}>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>Ausgewählte Tage: {totalDays}/7</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(totalDays / 7) * 100}%`, backgroundColor: totalDays === 7 ? Colors.primary : '#ff9f43' }]} />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        color: Colors.text,
    },
    clearText: {
        color: '#ff6b6b',
        fontSize: 16,
        fontWeight: '600',
    },
    configSection: {
        margin: 20,
        marginTop: 10,
        backgroundColor: Colors.card,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
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
        backgroundColor: '#333',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    countersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    counterContainer: {
        alignItems: 'center',
    },
    counterLabel: {
        fontWeight: '700',
        marginBottom: 8,
        fontSize: 14,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 4,
    },
    counterButton: {
        padding: 8,
    },
    counterValue: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
    generateButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: Colors.primary,
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
        backgroundColor: Colors.card,
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
        borderBottomColor: 'rgba(255,255,255,0.05)',
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
        borderColor: '#444',
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
        color: Colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
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
        color: Colors.text,
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
