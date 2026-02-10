import { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMealContext } from '../context/MealContext';

export default function FriendMealsModal({ visible, onClose }) {
    const { colors, theme } = useTheme();
    const { searchFriendMeals, importFriendMeal, meals: myMeals } = useMealContext();
    const [email, setEmail] = useState('');
    const [friendMeals, setFriendMeals] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [importingId, setImportingId] = useState(null);

    const styles = getStyles(colors, theme);

    const handleSearch = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes('@')) {
            Alert.alert('Ungültige E-Mail', 'Bitte gib eine gültige E-Mail-Adresse ein.');
            return;
        }
        setSearching(true);
        setSearched(false);
        try {
            const results = await searchFriendMeals(trimmed);
            setFriendMeals(results);
            setSearched(true);
        } catch (err) {
            console.error('Search error:', err);
            Alert.alert('Fehler', err?.message || 'Fehler beim Suchen der Gerichte.');
            setSearched(true);
        } finally {
            setSearching(false);
        }
    };

    const handleImport = async (meal) => {
        // Check if already exists locally
        const normalizedName = meal.name.trim().toLowerCase();
        const exists = myMeals.some(m => m.name.trim().toLowerCase() === normalizedName);
        if (exists) {
            Alert.alert('Bereits vorhanden', `"${meal.name}" ist bereits in deiner Sammlung.`);
            return;
        }

        setImportingId(meal.id);
        try {
            await importFriendMeal(meal);
            Alert.alert('Importiert!', `"${meal.name}" wurde zu deiner Sammlung hinzugefügt.`);
        } catch (err) {
            if (err.message === 'DUPLICATE_MEAL') {
                Alert.alert('Bereits vorhanden', `"${meal.name}" ist bereits in deiner Sammlung.`);
            } else {
                Alert.alert('Fehler', 'Fehler beim Importieren des Gerichts.');
            }
        } finally {
            setImportingId(null);
        }
    };

    const handleClose = () => {
        setEmail('');
        setFriendMeals([]);
        setSearched(false);
        onClose();
    };

    const getCategoryLabel = (cat) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            default: return cat.toUpperCase();
        }
    };

    const isAlreadyImported = (meal) => {
        const normalizedName = meal.name.trim().toLowerCase();
        return myMeals.some(m => m.name.trim().toLowerCase() === normalizedName);
    };

    const renderMealItem = ({ item }) => {
        const alreadyHave = isAlreadyImported(item);
        return (
            <View style={styles.mealCard}>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{item.name}</Text>
                    <View style={styles.categoriesRow}>
                        {item.categories && item.categories.map(cat => (
                            <View key={cat} style={[styles.categoryBadge, { backgroundColor: (colors[cat] || colors.primary) + '20' }]}>
                                <Text style={[styles.categoryText, { color: colors[cat] || colors.primary }]}>
                                    {getCategoryLabel(cat)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.importButton, alreadyHave && styles.importButtonDisabled]}
                    onPress={() => handleImport(item)}
                    disabled={alreadyHave || importingId === item.id}
                >
                    {importingId === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons
                            name={alreadyHave ? "checkmark-circle" : "download-outline"}
                            size={20}
                            color="#fff"
                        />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Gerichte von Freunden</Text>
                        <TouchableOpacity onPress={handleClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>
                        Suche nach der E-Mail-Adresse eines Freundes, um dessen geteilte Gerichte zu sehen und zu importieren.
                    </Text>

                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="E-Mail-Adresse des Freundes"
                            placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={[styles.searchButton, (!email.trim()) && styles.disabledButton]}
                            onPress={handleSearch}
                            disabled={!email.trim() || searching}
                        >
                            {searching ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="search" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {searching && (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.searchingText}>Suche Gerichte...</Text>
                        </View>
                    )}

                    {searched && !searching && friendMeals.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={48} color="#888" />
                            <Text style={styles.emptyText}>Keine geteilten Gerichte gefunden.</Text>
                            <Text style={styles.emptyHint}>Dieser Freund hat noch keine Gerichte geteilt oder die E-Mail-Adresse ist nicht korrekt.</Text>
                        </View>
                    )}

                    {friendMeals.length > 0 && (
                        <FlatList
                            data={friendMeals}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMealItem}
                            style={styles.list}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const getStyles = (colors, theme) => StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '92%',
        maxHeight: '80%',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
    },
    description: {
        color: '#888',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        color: colors.text,
        padding: 12,
        borderRadius: 10,
        fontSize: 15,
        marginRight: 10,
    },
    searchButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    list: {
        maxHeight: 350,
    },
    mealCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    mealInfo: {
        flex: 1,
        marginRight: 10,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    categoriesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
    },
    importButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    importButtonDisabled: {
        backgroundColor: '#888',
        opacity: 0.6,
    },
    centerContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    searchingText: {
        marginTop: 10,
        color: '#888',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    emptyText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptyHint: {
        color: '#888',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },
});
