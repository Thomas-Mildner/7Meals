import { useState, useCallback, useEffect } from 'react';
import { useMeals } from './useMeals';
import { useAuth } from '../context/AuthContext';
import { savePlan as savePlanService, getPlan as getPlanService } from '../services/plan';
import { updateLastEatenDate } from '../services/meals';

export const useMealPlan = () => {
    const { meals, refreshMeals } = useMeals();
    const { user } = useAuth();
    const [plan, setPlan] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [config, setConfig] = useState({ meat: 2, fish: 2, veg: 2, brotzeit: 1 });
    const [loadingPlan, setLoadingPlan] = useState(false);

    // Load plan on mount
    useEffect(() => {
        const loadPlan = async () => {
            if (!user) return;
            setLoadingPlan(true);
            try {
                const storedPlan = await getPlanService(user.uid);
                if (storedPlan && storedPlan.days) {
                    setPlan(storedPlan.days);
                    setStartDate(storedPlan.startDate);
                }
            } catch (e) {
                console.error("Failed to load plan", e);
            } finally {
                setLoadingPlan(false);
            }
        };
        loadPlan();
    }, [user]);

    const saveCurrentPlan = async (newPlan, newStartDate) => {
        if (!user) return;
        setPlan(newPlan);
        setStartDate(newStartDate);
        try {
            await savePlanService(user.uid, {
                days: newPlan,
                startDate: newStartDate
            });
        } catch (e) {
            console.error("Failed to save plan", e);
        }
    };

    const archiveOldPlan = async () => {
        if (!plan || plan.length === 0 || !startDate) return;

        console.log("Archiving old plan...");
        const start = new Date(startDate);

        // Iterate through valid days
        const promises = plan.map(async (dayItem, index) => {
            if (!dayItem) return; // specific safety

            // If already marked as eaten (has specific lastEaten date matching plan), skip?
            // Actually, we want to ensure *unmarked* meals are marked.
            // But we need to be careful not to overwrite a RECENT manual entry with an older theoretical one?
            // "If no meal was ate but plan was generated... assume meals were eaten"

            // Calculate theoretical date
            const theoreticalDate = new Date(start);
            theoreticalDate.setDate(start.getDate() + index);
            const isoDate = theoreticalDate.toISOString();

            // We update the meal's lastEaten date to this theoretical date
            // This works perfectly for the history
            try {
                await updateLastEatenDate(dayItem.id, isoDate);
            } catch (e) {
                console.error(`Failed to archive meal ${dayItem.name}`, e);
            }
        });

        await Promise.all(promises);
        // Refresh meals to update 'lastEaten' in local state immediately so algorithm sees it
        await refreshMeals();
    };

    const generatePlan = useCallback(async () => {
        if (meals.length === 0) return;

        // 1. Archive old plan if exists
        if (plan.length > 0) {
            await archiveOldPlan();
        }

        const meatMeals = meals.filter(m => m.categories && m.categories.includes('meat'));
        const fishMeals = meals.filter(m => m.categories && m.categories.includes('fish'));
        const vegMeals = meals.filter(m => m.categories && m.categories.includes('veg'));

        const newPlanDays = [];

        const generatedWarnings = [];

        const getRandomMeals = (source, count, categoryLabel) => {
            let pool = [...source];
            // Fallback if specific category is empty
            if (pool.length === 0) {
                if (meals.length > 0) {
                    pool = [...meals];
                    generatedWarnings.push(`Keine Gerichte für '${categoryLabel}' gefunden. Zufällige Alternativen gewählt.`);
                } else {
                    // No meals at all in DB
                    generatedWarnings.push(`Keine Gerichte für '${categoryLabel}' verfügbar.`);
                    const placeholders = [];
                    for (let k = 0; k < count; k++) {
                        placeholders.push({
                            id: `placeholder-${categoryLabel}-${Date.now()}-${k}`,
                            name: `Gericht hinzufügen (${categoryLabel})`,
                            categories: [],
                            isFavorite: false
                        });
                    }
                    return placeholders;
                }
            }

            const selected = [];
            // Basic weighted random selection
            for (let i = 0; i < count; i++) {
                if (pool.length === 0) pool = source.length > 0 ? [...source] : [...meals];

                // Safety: if pool is STILL empty (means meals.length was 0 initially and we are here?), break
                if (pool.length === 0) break;

                const scoredPool = pool.map(meal => {
                    let score = 10;
                    if (meal.isFavorite) score += 150;
                    if (meal.lastEaten) {
                        const daysAgo = (new Date() - new Date(meal.lastEaten)) / (1000 * 60 * 60 * 24);
                        if (daysAgo < 2) score *= 0.1;
                        else if (daysAgo < 5) score *= 0.5;
                        else if (daysAgo > 14) score += 20;
                    } else {
                        score += 30;
                    }
                    return { meal, score: Math.max(1, score) };
                });

                const totalScore = scoredPool.reduce((acc, item) => acc + item.score, 0);
                let randomValue = Math.random() * totalScore;

                let chosenMeal = scoredPool[0].meal;
                for (const item of scoredPool) {
                    randomValue -= item.score;
                    if (randomValue <= 0) {
                        chosenMeal = item.meal;
                        break;
                    }
                }

                selected.push(chosenMeal);
                pool = pool.filter(m => m.id !== chosenMeal.id);
            }
            return selected;
        };

        newPlanDays.push(...getRandomMeals(meatMeals, config.meat, 'Fleisch'));
        newPlanDays.push(...getRandomMeals(fishMeals, config.fish, 'Fisch'));
        newPlanDays.push(...getRandomMeals(vegMeals, config.veg, 'Veggie'));

        // Add Brotzeit placeholders
        for (let i = 0; i < config.brotzeit; i++) {
            newPlanDays.push({
                id: `brotzeit-${Date.now()}-${i}`,
                name: 'Brotzeit',
                categories: ['brotzeit'],
                isFavorite: false,
                lastEaten: null
            });
        }

        // Shuffle
        for (let i = newPlanDays.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newPlanDays[i], newPlanDays[j]] = [newPlanDays[j], newPlanDays[i]];
        }

        // Ensure 7 days and Save
        const finalPlan = newPlanDays.slice(0, 7);
        const newStartDate = new Date().toISOString(); // Plan starts "Today"
        await saveCurrentPlan(finalPlan, newStartDate);

        // Check for duplicates in the generated plan
        // We count how many times each meal ID appears
        const idCounts = {};
        let hasDuplicates = false;
        finalPlan.forEach(m => {
            idCounts[m.id] = (idCounts[m.id] || 0) + 1;
            if (idCounts[m.id] > 1) hasDuplicates = true;
        });

        return { hasDuplicates, warnings: generatedWarnings };

    }, [meals, config, plan, startDate, user, refreshMeals]);

    const swapMeal = async (index, desiredCategory) => {
        const currentMeal = plan[index];
        // For swapping, we need to know which category slot this day is intended for.
        // Heuristic: currentMeal might have multiple categories.
        // But the PLAN slot was generated for a specific category type (meat/fish/veg).
        // If we want to replace a "Meat Day" meal, we should look for other 'meat' meals.
        // If 'desiredCategory' is passed (not implemented in UI explicitly yet usually), we use that.
        // Otherwise, if current meal has multiple, this is ambiguous.
        // Let's assume we want to swap for a meal that shares AT LEAST ONE category with the current one?
        // Or simpler: The user probably wants another meal of the same "primary" type.
        // Since we don't store "SlotType" in the plan, we might just use the desiredCategory passed from UI if available.
        // If not, we iterate current meal categories and find matches.

        let targetCategory = desiredCategory;
        if (!targetCategory && currentMeal.categories && currentMeal.categories.length > 0) {
            targetCategory = currentMeal.categories[0]; // fallback to first
        }

        // If it's a Brotzeit slot (or user wants to swap TO random), force swap to a real meal?
        // Or if user clicks swap on Brotzeit, maybe they want a real meal instead.
        // Let's assume if category is 'brotzeit', we swap to ANY random meal from the collection
        // to give inspiration.
        let candidates = [];
        if (targetCategory === 'brotzeit') {
            candidates = meals.filter(m => m.id !== currentMeal.id);
        } else {
            candidates = meals.filter(m => m.categories && m.categories.includes(targetCategory) && m.id !== currentMeal.id);
        }

        if (candidates.length > 0) {
            const randomNew = candidates[Math.floor(Math.random() * candidates.length)];
            const updatedPlan = [...plan];
            updatedPlan[index] = randomNew;
            await saveCurrentPlan(updatedPlan, startDate); // Persist swap
        } else {
            alert("No other meals available in this category!");
        }
    };

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }

    const clearPlan = async () => {
        setPlan([]);
        setStartDate(null);
        if (user) await savePlanService(user.uid, { days: [], startDate: null });
    };

    const toggleMealEaten = async (index) => {
        if (!plan[index]) return;

        const updatedPlan = [...plan];
        const isCurrentlyEaten = !!updatedPlan[index].isEaten;
        updatedPlan[index] = {
            ...updatedPlan[index],
            isEaten: !isCurrentlyEaten
        };

        setPlan(updatedPlan);

        // Persist to plan service
        if (user) {
            try {
                await savePlanService(user.uid, {
                    days: updatedPlan,
                    startDate
                });
            } catch (e) {
                console.error("Failed to save plan after toggle", e);
            }
        }

        // If marking as eaten, update the meal's global lastEaten for weighting
        if (!isCurrentlyEaten) {
            try {
                const today = new Date().toISOString();
                await updateLastEatenDate(updatedPlan[index].id, today);
                await refreshMeals(); // Refresh global meal list to update scores
            } catch (e) {
                console.error("Failed to update global lastEaten", e);
            }
        }
    };

    return { plan, startDate, config, updateConfig, generatePlan, swapMeal, clearPlan, toggleMealEaten, loadingPlan };
};
