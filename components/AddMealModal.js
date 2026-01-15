import { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../constants/Colors';

export default function AddMealModal({ visible, onClose, onAdd }) {
    const [name, setName] = useState('');
    const [categories, setCategories] = useState([]);

    const handleAdd = async () => {
        if (name && categories.length > 0) {
            try {
                await onAdd(name, categories);
                setName('');
                setCategories([]);
                onClose();
            } catch (e) {
                if (e.message === 'DUPLICATE_MEAL') {
                    alert("Dieses Gericht existiert bereits!");
                } else {
                    alert("Fehler beim Hinzufügen des Gerichts.");
                }
            }
        }
    };

    const toggleCategory = (cat) => {
        setCategories(prev => {
            if (prev.includes(cat)) {
                return prev.filter(c => c !== cat);
            } else {
                return [...prev, cat];
            }
        });
    };

    const getCategoryLabel = (cat) => {
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
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
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
                                        { borderColor: Colors[cat] }
                                    ]}
                                    onPress={() => toggleCategory(cat)}
                                >
                                    <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                                        {getCategoryLabel(cat)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
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

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: Colors.card,
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
        color: Colors.text,
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: Colors.background,
        color: Colors.text,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
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
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    categoryText: {
        color: Colors.text,
        fontWeight: '600',
    },
    selectedCategoryText: {
        color: '#fff',
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
        backgroundColor: Colors.primary,
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
