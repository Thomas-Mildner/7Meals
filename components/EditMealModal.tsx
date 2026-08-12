import { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Switch, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { scrapeRecipe } from '../utils/scraper';
import { Ionicons } from '@expo/vector-icons';

export default function EditMealModal({ visible, onClose, onSave, meal }: any) {
    const { colors, theme } = useTheme();
    const [name, setName] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [isShared, setIsShared] = useState(false);
    const [description, setDescription] = useState('');
    const [ingredientsText, setIngredientsText] = useState('');
    const [duration, setDuration] = useState<number | undefined>();
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>();
    const [importUrl, setImportUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [scrapedImageUrl, setScrapedImageUrl] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState('');

    const styles = getStyles(colors, theme);

    // Populate fields when meal changes
    useEffect(() => {
        if (meal) {
            setName(meal.name || '');
            setCategories(meal.categories || []);
            setIsShared(meal.isShared || false);
            setDescription(meal.description || '');
            setIngredientsText(meal.ingredients ? meal.ingredients.join('\n') : '');
            setDuration(meal.duration);
            setDifficulty(meal.difficulty);
            setImportUrl('');
            setScrapedImageUrl(null);
        }
    }, [meal]);

    const handleSave = async () => {
        if (name && categories.length > 0) {
            try {
                const ingredients = ingredientsText.split('\n').map(i => i.trim()).filter(i => i.length > 0);
                await onSave(meal.id, {
                    name: name.trim(),
                    categories,
                    isShared,
                    description: description.trim(),
                    ingredients,
                    duration,
                    difficulty,
                    ...(scrapedImageUrl ? { imageUrl: scrapedImageUrl } : {})
                });
                setImportUrl('');
                setScrapedImageUrl(null);
                onClose();
            } catch (e: any) {
                if (e.message === 'DUPLICATE_MEAL') {
                    alert("Ein anderes Gericht mit diesem Namen existiert bereits!");
                } else {
                    alert("Fehler beim Speichern des Gerichts.");
                }
            }
        }
    };

    const toggleCategory = (cat: string) => {
        setCategories(prev => {
            if (prev.includes(cat)) {
                return prev.filter(c => c !== cat);
            } else {
                return [...prev, cat];
            }
        });
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'meat': return 'FLEISCH';
            case 'fish': return 'FISCH';
            case 'veg': return 'VEGGIE';
            default: return cat.toUpperCase();
        }
    };

    const handleScrape = async () => {
        if (!importUrl) return;
        setIsScraping(true);
        setProgressMessage('Start...');
        try {
            const data = await scrapeRecipe(importUrl, (msg) => setProgressMessage(msg));
            if (data.name) setName(data.name);
            if (data.description) setDescription(data.description);
            if (data.ingredients.length > 0) setIngredientsText(data.ingredients.join('\n'));
            if (data.prepTime) setDuration(data.prepTime);
            if (data.image) setScrapedImageUrl(data.image);
            setImportUrl(''); // clear after success
        } catch (error) {
            Alert.alert("Fehler", "Rezept konnte nicht importiert werden. Bitte überprüfe den Link.");
        } finally {
            setIsScraping(false);
            setProgressMessage('');
        }
    };

    if (!meal) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Gericht bearbeiten</Text>

                    {/* Scraper Input (Nur Mobile) */}
                    {Platform.OS !== 'web' && (
                        <View style={styles.importContainer}>
                            <TextInput
                                style={[styles.input, styles.importInput]}
                                placeholder="Rezept-Link einfügen (z.B. Chefkoch)"
                                placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                                value={importUrl}
                                onChangeText={setImportUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity style={[styles.importButton, { backgroundColor: colors.primary }]} onPress={handleScrape} disabled={isScraping || !importUrl}>
                                {isScraping ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="color-wand-outline" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {isScraping && (
                        <View style={{ width: '100%', marginBottom: 15, alignItems: 'center' }}>
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>
                                🪄 {progressMessage || 'Rezept wird analysiert...'}
                            </Text>
                        </View>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Gericht Name"
                        placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Beschreibung (optional)"
                        placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                        value={description as string}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={2}
                    />

                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Zutaten (optional, eine pro Zeile)"
                        placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                        value={ingredientsText}
                        onChangeText={setIngredientsText}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.categoryContainer}>
                        {['meat', 'fish', 'veg'].map((cat) => {
                            const isSelected = categories.includes(cat);
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: isSelected ? colors[cat] : (theme === 'dark' ? '#444' : '#ddd') },
                                        isSelected && { backgroundColor: colors[cat] }
                                    ]}
                                    onPress={() => toggleCategory(cat)}
                                >
                                    <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText, { color: isSelected ? '#fff' : colors.text }]}>
                                        {getCategoryLabel(cat)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionLabel}>Dauer</Text>
                    <View style={styles.categoryContainer}>
                        {[15, 30, 45, 60].map((mins) => {
                            const isSelected = duration === mins;
                            return (
                                <TouchableOpacity
                                    key={mins}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: isSelected ? colors.primary : (theme === 'dark' ? '#444' : '#ddd') },
                                        isSelected && { backgroundColor: colors.primary }
                                    ]}
                                    onPress={() => setDuration(isSelected ? undefined : mins)}
                                >
                                    <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText, { color: isSelected ? '#fff' : colors.text }]}>
                                        {mins} Min
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionLabel}>Aufwand</Text>
                    <View style={styles.categoryContainer}>
                        {[
                            { id: 'easy', label: 'LEICHT' },
                            { id: 'medium', label: 'MITTEL' },
                            { id: 'hard', label: 'SCHWER' }
                        ].map((diff) => {
                            const isSelected = difficulty === diff.id;
                            return (
                                <TouchableOpacity
                                    key={diff.id}
                                    style={[
                                        styles.categoryChip,
                                        { borderColor: isSelected ? colors.primary : (theme === 'dark' ? '#444' : '#ddd') },
                                        isSelected && { backgroundColor: colors.primary }
                                    ]}
                                    onPress={() => setDifficulty(isSelected ? undefined : diff.id as any)}
                                >
                                    <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText, { color: isSelected ? '#fff' : colors.text }]}>
                                        {diff.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.shareContainer}>
                        <View style={styles.shareTextContainer}>
                            <Text style={styles.shareLabel}>Mit Freunden teilen</Text>
                            <Text style={styles.shareHint}>Andere können dieses Gericht finden</Text>
                        </View>
                        <Switch
                            value={isShared}
                            onValueChange={setIsShared}
                            trackColor={{ false: theme === 'dark' ? '#555' : '#ccc', true: colors.primary + '80' }}
                            thumbColor={isShared ? colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, (!name || categories.length === 0) && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={!name || categories.length === 0}
                        >
                            <Text style={styles.buttonText}>Speichern</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const getStyles = (colors: any, theme: string) => StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
    },
    importContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        gap: 10,
    },
    importInput: {
        flex: 1,
        marginBottom: 0,
        backgroundColor: 'rgba(128,128,128,0.1)',
        borderColor: 'transparent',
    },
    importButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: theme === 'dark' ? '#222' : '#f5f5f5',
        color: colors.text,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#333' : '#eee',
        marginBottom: 12,
        fontSize: 16,
    },
    descriptionInput: {
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    sectionLabel: {
        width: '100%',
        textAlign: 'left',
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
        marginLeft: 10,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        width: '100%',
        marginBottom: 25,
    },
    categoryChip: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    categoryText: {
        color: colors.text,
        fontWeight: '600',
    },
    selectedCategoryText: {
        color: '#fff',
    },
    shareContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    shareTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    shareLabel: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
    shareHint: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
    },
    cancelButtonText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
