import { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Switch, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { scrapeRecipe } from '../utils/scraper';
import { Ionicons } from '@expo/vector-icons';

interface AddMealModalProps {
    visible: boolean;
    onClose: (addedMealName?: string) => void;
    onAdd: (name: string, categories: string[], description?: string, isShared?: boolean, ingredients?: string[], duration?: number, difficulty?: 'easy' | 'medium' | 'hard', imageUrl?: string | null) => Promise<void>;
}

export default function AddMealModal({ visible, onClose, onAdd }: AddMealModalProps) {
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
    const [progressMessage, setProgressMessage] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Dynamic styles
    const styles = getStyles(colors, theme);

    const resetForm = () => {
        setName('');
        setCategories([]);
        setIsShared(false);
        setDescription('');
        setIngredientsText('');
        setDuration(undefined);
        setDifficulty(undefined);
        setImportUrl('');
        setImageUri(null);
        setIsSaving(false);
        setIsSuccess(false);
    };

    const handleCancel = () => {
        if (isSaving) return;
        resetForm();
        onClose();
    };

    const handleAdd = async () => {
        if (name.trim() && categories.length > 0 && !isSaving) {
            setIsSaving(true);
            try {
                const ingredients = ingredientsText.split('\n').map(i => i.trim()).filter(i => i.length > 0);
                const mealName = name.trim();
                await onAdd(mealName, categories, description.trim(), isShared, ingredients, duration, difficulty, imageUri);
                
                setIsSuccess(true);
                setTimeout(() => {
                    resetForm();
                    onClose(mealName);
                }, 600);
            } catch (e: any) {
                setIsSaving(false);
                if (e.message === 'DUPLICATE_MEAL') {
                    Alert.alert("Bereits vorhanden", "Dieses Gericht existiert bereits in deiner Sammlung!");
                } else {
                    Alert.alert("Fehler", "Fehler beim Hinzufügen des Gerichts.");
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

    const pickImage = async (source: 'camera' | 'gallery') => {
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
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Berechtigung fehlt', 'Wir benötigen Zugriff auf deine Galerie.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Error selecting image:", error);
            Alert.alert("Fehler", "Das Bild konnte nicht ausgewählt werden.");
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
            if (data.image) setImageUri(data.image);
            setImportUrl(''); // clear after success
        } catch (error) {
            Alert.alert("Fehler", "Rezept konnte nicht importiert werden. Bitte überprüfe den Link.");
        } finally {
            setIsScraping(false);
            setProgressMessage('');
        }
    };

    const isDesktopWeb = Platform.OS === 'web' && typeof navigator !== 'undefined' && !/Mobi|Android|iPhone/i.test(navigator.userAgent);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleCancel}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Neues Gericht hinzufügen</Text>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollInner}
                        style={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                    >
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
                                <TouchableOpacity
                                    style={[styles.importButton, { backgroundColor: colors.primary }]}
                                    onPress={handleScrape}
                                    disabled={isScraping || !importUrl}
                                >
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

                        {/* Foto-Sektion */}
                        <View style={styles.imageSection}>
                            <Text style={styles.sectionLabel}>Foto (optional)</Text>
                            {imageUri ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.imagePreview}
                                        contentFit="cover"
                                        transition={200}
                                        cachePolicy="memory-disk"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => setImageUri(null)}
                                        hitSlop={8}
                                    >
                                        <Ionicons name="close-circle" size={26} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <View style={styles.changeImageOverlay}>
                                        <TouchableOpacity
                                            style={styles.changeImageChip}
                                            onPress={() => pickImage('gallery')}
                                        >
                                            <Ionicons name="images-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                                            <Text style={styles.changeImageText}>Ändern</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.photoPickerBox}>
                                    <Ionicons name="camera-outline" size={28} color={theme === 'dark' ? '#888' : '#666'} style={{ marginBottom: 6 }} />
                                    <Text style={styles.photoPickerPrompt}>Foto zum Gericht hinzufügen</Text>
                                    <View style={styles.photoButtonsRow}>
                                        {!isDesktopWeb && (
                                            <TouchableOpacity
                                                style={[styles.photoActionButton, { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#EDEDED' }]}
                                                onPress={() => pickImage('camera')}
                                            >
                                                <Ionicons name="camera" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                                                <Text style={[styles.photoActionText, { color: colors.text }]}>Kamera</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.photoActionButton, { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#EDEDED' }]}
                                            onPress={() => pickImage('gallery')}
                                        >
                                            <Ionicons name="images" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                                            <Text style={[styles.photoActionText, { color: colors.text }]}>
                                                {isDesktopWeb ? 'Bild auswählen' : 'Galerie'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Gericht Name (z.B. Spätzle)"
                            placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={[styles.input, styles.descriptionInput]}
                            placeholder="Beschreibung (optional)"
                            placeholderTextColor={theme === 'dark' ? "#999" : "#666"}
                            value={description}
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

                        <Text style={styles.sectionLabel}>Kategorie *</Text>
                        <View style={styles.categoryContainer}>
                            {['meat', 'fish', 'veg'].map((cat) => {
                                const isSelected = categories.includes(cat);
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryChip,
                                            { borderColor: isSelected ? (colors as any)[cat] : (theme === 'dark' ? '#444' : '#ddd') },
                                            isSelected && { backgroundColor: (colors as any)[cat] }
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
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, isSaving && styles.disabledButton]}
                            onPress={handleCancel}
                            disabled={isSaving}
                        >
                            <Text style={styles.cancelButtonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.addButton,
                                (!name.trim() || categories.length === 0 || isSaving) && styles.disabledButton,
                                isSuccess && styles.successButton
                            ]}
                            onPress={handleAdd}
                            disabled={!name.trim() || categories.length === 0 || isSaving}
                        >
                            {isSaving ? (
                                <View style={styles.buttonInnerLoading}>
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Wird gespeichert...</Text>
                                </View>
                            ) : isSuccess ? (
                                <View style={styles.buttonInnerLoading}>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={styles.buttonText}>Gespeichert!</Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Hinzufügen</Text>
                            )}
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
        maxHeight: '90%',
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
    scrollView: {
        width: '100%',
    },
    scrollInner: {
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
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
    imageSection: {
        width: '100%',
        marginBottom: 16,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 140,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f0f0f0',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 2,
    },
    changeImageOverlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
    },
    changeImageChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    changeImageText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    photoPickerBox: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: theme === 'dark' ? '#3e3e42' : '#d1d5db',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    },
    photoPickerPrompt: {
        fontSize: 13,
        color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        marginBottom: 10,
        fontWeight: '500',
    },
    photoButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    photoActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    photoActionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        width: '100%',
        backgroundColor: theme === 'dark' ? '#222' : '#f5f5f5',
        color: colors.text,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#333' : '#eee',
        marginBottom: 12,
        fontSize: 15,
    },
    descriptionInput: {
        minHeight: 56,
        textAlignVertical: 'top',
        marginBottom: 14,
    },
    sectionLabel: {
        width: '100%',
        textAlign: 'left',
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
        marginBottom: 18,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
    },
    categoryText: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 13,
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
        marginBottom: 16,
    },
    shareTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    shareLabel: {
        color: colors.text,
        fontSize: 14,
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
        paddingTop: 8,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    cancelButton: {
        backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
    },
    cancelButtonText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 15,
    },
    addButton: {
        backgroundColor: colors.primary,
    },
    successButton: {
        backgroundColor: '#10B981',
    },
    buttonInnerLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
