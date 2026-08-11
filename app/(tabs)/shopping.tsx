import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useMealPlan } from '../../hooks/useMealPlan';
import { useMeals } from '../../hooks/useMeals';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ShoppingScreen() {
    const { plan, startDate } = useMealPlan();
    const { meals } = useMeals();
    const { colors, theme } = useTheme();
    const styles = getStyles(colors, theme);

    // Track checked items
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

    // Generate shopping list from plan using live meal data for ingredients
    const shoppingList = useMemo(() => {
        if (!plan || plan.length === 0) return [];
        
        const ingredientsMap = new Map<string, { name: string, count: number, mealNames: Set<string> }>();

        plan.forEach(planMeal => {
            if (!planMeal) return;
            // Always fetch the live meal from Context so edits (like adding ingredients) are immediately reflected in the plan
            const liveMeal = meals.find(m => m.id === planMeal.id) || planMeal;
            
            if (liveMeal.ingredients && liveMeal.ingredients.length > 0) {
                liveMeal.ingredients.forEach(ing => {
                    const normalized = ing.trim().toLowerCase();
                    if (ingredientsMap.has(normalized)) {
                        const existing = ingredientsMap.get(normalized)!;
                        existing.count += 1;
                        existing.mealNames.add(liveMeal.name);
                    } else {
                        const mealSet = new Set<string>();
                        mealSet.add(liveMeal.name);
                        ingredientsMap.set(normalized, { name: ing.trim(), count: 1, mealNames: mealSet });
                    }
                });
            }
        });

        // Convert map to sorted array
        return Array.from(ingredientsMap.values()).map(item => ({
            ...item,
            mealNames: Array.from(item.mealNames)
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [plan]);

    // Load checked items for the current plan week
    useEffect(() => {
        const loadCheckedState = async () => {
            if (!startDate) return;
            try {
                const stored = await AsyncStorage.getItem(`shopping_${startDate}`);
                if (stored) {
                    setCheckedItems(JSON.parse(stored));
                } else {
                    setCheckedItems({});
                }
            } catch (e) {
                console.error("Failed to load shopping list state", e);
            }
        };
        loadCheckedState();
    }, [startDate]);

    const toggleItem = async (itemName: string) => {
        if (!startDate) return;
        const newChecked = { ...checkedItems, [itemName]: !checkedItems[itemName] };
        setCheckedItems(newChecked);
        try {
            await AsyncStorage.setItem(`shopping_${startDate}`, JSON.stringify(newChecked));
        } catch (e) {
            console.error("Failed to save shopping list state", e);
        }
    };

    const clearChecked = async () => {
        if (!startDate) return;
        setCheckedItems({});
        try {
            await AsyncStorage.removeItem(`shopping_${startDate}`);
        } catch (e) {
            console.error(e);
        }
    };

    if (shoppingList.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={80} color={colors.primary} style={{ opacity: 0.5, marginBottom: 20 }} />
                <Text style={styles.emptyTitle}>Einkaufsliste ist leer</Text>
                <Text style={styles.emptyText}>
                    Füge Gerichte mit Zutaten zu deinem Wochenplan hinzu, um hier automatisch eine Einkaufsliste zu sehen.
                </Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: { name: string, count: number, mealNames: string[] } }) => {
        const isChecked = checkedItems[item.name] || false;
        return (
            <TouchableOpacity 
                style={[styles.itemContainer, isChecked && styles.itemCheckedContainer]} 
                onPress={() => toggleItem(item.name)}
                activeOpacity={0.7}
            >
                <View style={[styles.checkbox, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.itemTextContainer}>
                    <View style={styles.itemTextRow}>
                        <Text style={[styles.itemText, isChecked && styles.itemTextChecked]}>
                            {item.name}
                        </Text>
                        {item.count > 1 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.count}x</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.mealChipsContainer}>
                        {item.mealNames.map((mealName, index) => (
                            <View key={index} style={styles.mealChip}>
                                <Text style={styles.mealChipText}>{mealName}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Einkaufsliste</Text>
                {Object.values(checkedItems).some(v => v) && (
                    <TouchableOpacity onPress={clearChecked} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>Zurücksetzen</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={shoppingList}
                keyExtractor={(item) => item.name}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
        marginBottom: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -1,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderRadius: 12,
    },
    clearButtonText: {
        color: '#ff6b6b',
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    itemCheckedContainer: {
        opacity: 0.6,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#888',
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    itemTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    itemText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    itemTextChecked: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    badge: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    mealChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    mealChip: {
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    mealChipText: {
        fontSize: 11,
        color: '#888',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        backgroundColor: colors.background,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 24,
    },
});
