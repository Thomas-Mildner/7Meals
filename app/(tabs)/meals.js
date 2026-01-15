import { useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMeals } from '../../hooks/useMeals';
import { Colors } from '../../constants/Colors';
import AddMealModal from '../../components/AddMealModal';
import ProfileModal from '../../components/ProfileModal';
import { useAuth } from '../../context/AuthContext';
import { seedDatabase } from '../../utils/seed';

export default function MealsScreen() {
    const { meals, loading, addMeal, removeMeal, toggleFavorite, refreshMeals } = useMeals();
    const { user } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        Alert.alert(
            "Beispielgerichte hinzufügen",
            "Dies fügt 10 Beispielgerichte zu deiner Liste hinzu. Fortfahren?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Hinzufügen",
                    onPress: async () => {
                        if (!user) {
                            Alert.alert("Fehler", "Du musst angemeldet sein, um Daten hinzuzufügen.");
                            return;
                        }
                        setSeeding(true);
                        const success = await seedDatabase(user.uid);
                        if (success) {
                            await refreshMeals();
                            Alert.alert("Erfolg", "10 Beispielgerichte hinzugefügt!");
                        } else {
                            Alert.alert("Fehler", "Fehler beim Hinzufügen. Überprüfe deinen API-Schlüssel.");
                        }
                        setSeeding(false);
                    }
                }
            ]
        );
    };

    const getCategoryLabel = (cat) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            default: return cat;
        }
    };

    const renderItem = ({ item }) => (
        <LinearGradient
            colors={[Colors.card, '#2a2a2a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mealCard}
        >
            {/* <View style={[styles.categoryStrip, { backgroundColor: Colors[item.category] }]} /> - Removing single color strip */}
            <View style={[styles.categoryStrip, { backgroundColor: '#444' }]} />

            <View style={styles.mealContent}>
                <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{item.name}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => toggleFavorite(item.id, !item.isFavorite)} hitSlop={10} style={{ marginRight: 10 }}>
                            <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={22} color={item.isFavorite ? "#ff6b6b" : "#666"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeMeal(item.id)} hitSlop={10}>
                            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {item.lastEaten && (
                    <Text style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                        Zuletzt: {new Date(item.lastEaten).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Text>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {item.categories && item.categories.map(cat => (
                        <View key={cat} style={[styles.categoryBadge, { backgroundColor: Colors[cat] + '20' }]}>
                            <Text style={[styles.categoryText, { color: Colors[cat] }]}>
                                {getCategoryLabel(cat)}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </LinearGradient>
    );

    // Prepare Sections
    const sections = [
        { title: 'FLEISCH', data: meals.filter(m => m.categories && m.categories.includes('meat')), key: 'meat', color: Colors.meat },
        { title: 'FISCH', data: meals.filter(m => m.categories && m.categories.includes('fish')), key: 'fish', color: Colors.fish },
        { title: 'VEGGIE', data: meals.filter(m => m.categories && m.categories.includes('veg')), key: 'veg', color: Colors.veg },
    ];

    // Filter out empty sections if desired, or keep to show empty state per section?
    // User probably wants to see all categories. But we can hide empty ones to be cleaner.
    // Let's keep them hidden if empty for cleaner UI, or show all. User specified "Group the meals". 
    // Usually SectionList only renders headers for data.
    const notEmptySections = sections.filter(s => s.data.length > 0);

    const renderSectionHeader = ({ section: { title, color } }) => (
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
                        style={[styles.iconButton, styles.seedButton]}
                        onPress={handleSeed}
                        disabled={seeding}
                    >
                        {seeding ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="construct-outline" size={22} color="#fff" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, styles.addButton]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={26} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                        onPress={() => setProfileModalVisible(true)}
                    >
                        <Ionicons name="person-outline" size={22} color={Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && meals.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Lade Gerichte...</Text>
                </View>
            ) : (
                <SectionList
                    sections={notEmptySections}
                    keyExtractor={(item, index) => item.id + index} // item might appear in multiple sections
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="restaurant-outline" size={60} color={Colors.primary} />
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
        </View>
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
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
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
        color: Colors.text,
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
    seedButton: {
        backgroundColor: '#4a5568',
    },
    addButton: {
        backgroundColor: Colors.primary,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    mealCard: {
        backgroundColor: Colors.card,
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
        color: Colors.text,
        flex: 1,
        marginRight: 10,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
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
        color: Colors.text,
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
});
