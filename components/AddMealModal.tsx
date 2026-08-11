import { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AddMealModal({ visible, onClose, onAdd }: any) {
    const { colors, theme } = useTheme();
    const [name, setName] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [isShared, setIsShared] = useState(false);
    const [description, setDescription] = useState('');
    const [ingredientsText, setIngredientsText] = useState('');

    // Dynamic styles
    const styles = getStyles(colors, theme);

    const handleAdd = async () => {
        if (name && categories.length > 0) {
            try {
                const ingredients = ingredientsText.split('\n').map(i => i.trim()).filter(i => i.length > 0);
                await onAdd(name, categories, description.trim(), isShared, ingredients);
                setName('');
                setCategories([]);
                setIsShared(false);
                setDescription('');
                setIngredientsText('');
                onClose();
            } catch (e: any) {
                if (e.message === 'DUPLICATE_MEAL') {
                    alert("Dieses Gericht existiert bereits!");
                } else {
                    alert("Fehler beim Hinzufügen des Gerichts.");
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

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Neues Gericht hinzufügen</Text>

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
                                        isSelected && styles.selectedCategory,
                                        { borderColor: colors[cat] }
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
                            <Text style={styles.buttonText}>Abbrechen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.addButton, (!name || categories.length === 0) && styles.disabledButton]}
                            onPress={handleAdd}
                            disabled={!name || categories.length === 0}
                        >
                            <Text style={styles.buttonText}>Hinzufügen</Text>
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
    input: {
        width: '100%',
        backgroundColor: colors.background,
        color: colors.text,
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 16,
    },
    descriptionInput: {
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    categoryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    selectedCategory: {
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
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
        backgroundColor: '#ff4444',
    },
    addButton: {
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
