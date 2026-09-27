import { useState, useCallback, useEffect } from 'react';
import { useMeals } from './useMeals';
import { useAuth } from '../context/AuthContext';
import { savePlan as savePlanService, getPlan as getPlanService } from '../services/plan';
import { Meal, DayPlan, DaySlot, PlanMeal } from '../types';
import { updateLastEatenDate } from '../services/meals';

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export const useMealPlan = () => {
    const { meals, refreshMeals } = useMeals();
    const { user } = useAuth();
    const [plan, setPlan] = useState<DayPlan[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [config, setConfig] = useState({ meat: 2, fish: 2, veg: 2, brotzeit: 1, maxTime: 0 });
    const [loadingPlan, setLoadingPlan] = useState(false);

    // Load plan on mount
    useEffect(() => {
        const loadPlan = async () => {
            if (!user) return;
            setLoadingPlan(true);
            try {
                const storedPlan = await getPlanService(user.uid);
                if (storedPlan && storedPlan.days && storedPlan.days.length > 0) {
                    // Backwards compatibility migration: if storedPlan.days is old format (PlanMeal[])
                    const migratedDays: DayPlan[] = storedPlan.days.map((dayItem: any, index: number) => {
                        if (dayItem && ('dinner' in dayItem || 'breakfast' in dayItem)) {
                            return dayItem as DayPlan;
                        } else {
                            // Old single-meal format
                            const oldMeal = dayItem as PlanMeal;
                            const prevDinner = index > 0 && storedPlan.days[index - 1] ? storedPlan.days[index - 1] : null;
                            return {
                                dayName: DAYS[index] || `Tag ${index + 1}`,
                                breakfast: {
                                    id: `placeholder-breakfast-${index}`,
                                    name: 'Frühstück auswählen',
                                    categories: ['veg'],
                                    mealTypes: ['breakfast'],
                                    isFavorite: false,
                                    userId: user.uid,
                                    ownerEmail: user.email || '',
                                    isShared: false,
                                    description: '',
                                    isEaten: false
                                },
                                lunch: prevDinner ? { ...prevDinner, isEaten: false } : {
                                    id: `leftover-prev-${index}`,
                                    name: 'Reste vom Vortag',
                                    categories: ['brotzeit'],
                                    isFavorite: false,
                                    userId: user.uid,
                                    ownerEmail: '',
                                    isShared: false,
                                    description: 'Essen vom Vortag',
                                    isEaten: false
                                },
                                dinner: oldMeal || {
                                    id: `placeholder-dinner-${index}`,
                                    name: 'Gericht auswählen',
                                    categories: ['veg'],
                                    mealTypes: ['main'],
                                    isFavorite: false,
                                    userId: user.uid,
                                    ownerEmail: '',
                                    isShared: false,
                                    description: '',
                                    isEaten: false
                                }
                            };
                        }
                    });
                    setPlan(migratedDays);
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

    const saveCurrentPlan = async (newPlan: DayPlan[], newStartDate: string) => {
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
        const promises: Promise<void>[] = [];

        plan.forEach((dayItem, index) => {
            if (!dayItem) return;

            const theoreticalDate = new Date(start);
            theoreticalDate.setDate(start.getDate() + index);
            const isoDate = theoreticalDate.toISOString();

            if (dayItem.breakfast && !dayItem.breakfast.id.startsWith('brotzeit-') && !dayItem.breakfast.id.startsWith('placeholder-')) {
                promises.push(
                    updateLastEatenDate(dayItem.breakfast.id, isoDate).catch(e => {
                        console.error(`Failed to archive meal ${dayItem.breakfast.name}`, e);
                    })
                );
            }

            if (dayItem.dinner && !dayItem.dinner.id.startsWith('brotzeit-') && !dayItem.dinner.id.startsWith('placeholder-')) {
                promises.push(
                    updateLastEatenDate(dayItem.dinner.id, isoDate).catch(e => {
                        console.error(`Failed to archive meal ${dayItem.dinner.name}`, e);
                    })
                );
            }
        });

        await Promise.all(promises);
        await refreshMeals();
    };

    const generatePlan = useCallback(async () => {
        if (meals.length === 0) return;

        // 1. Archive old plan if exists
        if (plan.length > 0) {
            await archiveOldPlan();
        }

        const generatedWarnings: string[] = [];

        // --- DINNER GENERATION ---
        let mainMeals = meals.filter(m => !m.mealTypes || m.mealTypes.length === 0 || m.mealTypes.includes('main'));
        if (config.maxTime > 0) {
            mainMeals = mainMeals.filter(m => !m.duration || m.duration <= config.maxTime);
        }

        const meatMeals = mainMeals.filter(m => m.categories && m.categories.includes('meat'));
        const fishMeals = mainMeals.filter(m => m.categories && m.categories.includes('fish'));
        const vegMeals = mainMeals.filter(m => m.categories && m.categories.includes('veg'));

        const getRandomMeals = (source: Meal[], count: number, categoryLabel: string): PlanMeal[] => {
            let pool = [...source];
            if (pool.length === 0) {
                if (mainMeals.length > 0) {
                    pool = [...mainMeals];
                    generatedWarnings.push(`Keine Gerichte für '${categoryLabel}' gefunden (Max. ${config.maxTime} Min). Zufällige Alternativen gewählt.`);
                } else {
                    generatedWarnings.push(`Keine Gerichte für '${categoryLabel}' verfügbar.`);
                    const placeholders: PlanMeal[] = [];
                    for (let k = 0; k < count; k++) {
                        placeholders.push({
                            id: `placeholder-${categoryLabel}-${Date.now()}-${k}`,
                            name: `Gericht hinzufügen (${categoryLabel})`,
                            categories: [],
                            mealTypes: ['main'],
                            isFavorite: false,
                            userId: user?.uid || '',
                            ownerEmail: user?.email || '',
                            isShared: false,
                            description: '',
                            isEaten: false
                        } as PlanMeal);
                    }
                    return placeholders;
                }
            }

            const selected: PlanMeal[] = [];
            for (let i = 0; i < count; i++) {
                if (pool.length === 0) pool = source.length > 0 ? [...source] : [...mainMeals];
                if (pool.length === 0) break;

                const scoredPool = pool.map(meal => {
                    let score = 10;
                    if (meal.isFavorite) score += 150;
                    if (meal.lastEaten) {
                        const daysAgo = (new Date().getTime() - new Date(meal.lastEaten as string).getTime()) / (1000 * 60 * 60 * 24);
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

                selected.push({ ...chosenMeal, isEaten: false });
                pool = pool.filter(m => m.id !== chosenMeal.id);
            }
            return selected;
        };

        const chosenDinners: PlanMeal[] = [];
        chosenDinners.push(...getRandomMeals(meatMeals, config.meat, 'Fleisch'));
        chosenDinners.push(...getRandomMeals(fishMeals, config.fish, 'Fisch'));
        chosenDinners.push(...getRandomMeals(vegMeals, config.veg, 'Veggie'));

        for (let i = 0; i < config.brotzeit; i++) {
            chosenDinners.push({
                id: `brotzeit-${Date.now()}-${i}`,
                name: 'Brotzeit',
                categories: ['brotzeit'],
                mealTypes: ['main'],
                isFavorite: false,
                userId: user?.uid || '',
                ownerEmail: user?.email || '',
                isShared: false,
                description: '',
                isEaten: false
            } as PlanMeal);
        }

        // Sort dinners by effort
        chosenDinners.sort((a, b) => {
            const getEffort = (m: Meal) => {
                let effort = m.duration || 30;
                if (m.difficulty === 'easy') effort -= 10;
                if (m.difficulty === 'hard') effort += 20;
                return effort;
            };
            return getEffort(a) - getEffort(b);
        });

        const weekdays = chosenDinners.slice(0, 5);
        const weekends = chosenDinners.slice(5, 7);

        for (let i = weekdays.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [weekdays[i], weekdays[j]] = [weekdays[j], weekdays[i]];
        }
        for (let i = weekends.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [weekends[i], weekends[j]] = [weekends[j], weekends[i]];
        }

        chosenDinners.length = 0;
        chosenDinners.push(...weekdays, ...weekends);
        const finalDinners = chosenDinners.slice(0, 7);

        // --- BREAKFAST GENERATION ---
        const breakfastCandidates = meals.filter(m => m.mealTypes && m.mealTypes.includes('breakfast'));
        const chosenBreakfasts: PlanMeal[] = [];

        if (breakfastCandidates.length === 0) {
            generatedWarnings.push("Noch keine Frühstücks-Gerichte gespeichert. Füge Gerichte als 'Frühstück' hinzu, um sie automatisch zu planen.");
            for (let i = 0; i < 7; i++) {
                chosenBreakfasts.push({
                    id: `placeholder-breakfast-${Date.now()}-${i}`,
                    name: 'Frühstück auswählen',
                    categories: ['veg'],
                    mealTypes: ['breakfast'],
                    isFavorite: false,
                    userId: user?.uid || '',
                    ownerEmail: user?.email || '',
                    isShared: false,
                    description: '',
                    isEaten: false
                } as PlanMeal);
            }
        } else {
            let bfPool = [...breakfastCandidates];
            for (let i = 0; i < 7; i++) {
                if (bfPool.length === 0) bfPool = [...breakfastCandidates];

                const scoredBfPool = bfPool.map(m => {
                    let score = 10;
                    if (m.isFavorite) score += 100;
                    if (m.lastEaten) {
                        const daysAgo = (new Date().getTime() - new Date(m.lastEaten as string).getTime()) / (1000 * 60 * 60 * 24);
                        if (daysAgo < 2) score *= 0.2;
                        else if (daysAgo > 7) score += 20;
                    }
                    return { meal: m, score: Math.max(1, score) };
                });

                const totalScore = scoredBfPool.reduce((acc, item) => acc + item.score, 0);
                let randomValue = Math.random() * totalScore;
                let chosen = scoredBfPool[0].meal;
                for (const item of scoredBfPool) {
                    randomValue -= item.score;
                    if (randomValue <= 0) {
                        chosen = item.meal;
                        break;
                    }
                }
                chosenBreakfasts.push({ ...chosen, isEaten: false });
                bfPool = bfPool.filter(m => m.id !== chosen.id);
            }
        }

        // --- ASSEMBLE 7 DAYS ---
        // "Mittagessen ist immer das essen vom Vortag"
        const previousSundayDinner = (plan.length >= 7 && plan[6]?.dinner && !plan[6].dinner.id.startsWith('placeholder-'))
            ? plan[6].dinner
            : null;

        const finalPlanDays: DayPlan[] = [];
        for (let i = 0; i < 7; i++) {
            const bf = chosenBreakfasts[i];
            const dn = finalDinners[i];
            let ln: PlanMeal;

            if (i === 0) {
                // Montag: Mittagessen ist das Essen vom Vortag (Sonntag)
                ln = previousSundayDinner
                    ? { ...previousSundayDinner, isEaten: false }
                    : {
                        id: `leftover-prev-${Date.now()}`,
                        name: 'Reste vom Vortag',
                        categories: ['brotzeit'],
                        mealTypes: ['main'],
                        isFavorite: false,
                        userId: user?.uid || '',
                        ownerEmail: '',
                        isShared: false,
                        description: 'Essen vom Vortag (Sonntag)',
                        isEaten: false
                    };
            } else {
                // Dienstag bis Sonntag: Mittagessen ist das Abendessen von Tag i - 1!
                ln = { ...finalDinners[i - 1], isEaten: false };
            }

            finalPlanDays.push({
                dayName: DAYS[i],
                breakfast: bf,
                lunch: ln,
                dinner: dn
            });
        }

        const newStartDate = new Date().toISOString();
        await saveCurrentPlan(finalPlanDays, newStartDate);

        // Check for duplicates in dinners
        const idCounts: Record<string, number> = {};
        let hasDuplicates = false;
        finalDinners.forEach(m => {
            idCounts[m.id] = (idCounts[m.id] || 0) + 1;
            if (idCounts[m.id] > 1) hasDuplicates = true;
        });

        return { hasDuplicates, warnings: generatedWarnings };
    }, [meals, config, plan, user, refreshMeals]);

    const swapMeal = async (index: number, slot: DaySlot = 'dinner', desiredCategory?: string) => {
        if (!plan[index]) return;
        const currentMeal = plan[index][slot];

        if (slot === 'breakfast') {
            const candidates = meals.filter(m => m.mealTypes?.includes('breakfast') && m.id !== currentMeal?.id);
            if (candidates.length > 0) {
                const randomNew = candidates[Math.floor(Math.random() * candidates.length)];
                const updatedPlan = [...plan];
                updatedPlan[index] = {
                    ...updatedPlan[index],
                    breakfast: { ...randomNew, isEaten: false }
                };
                await saveCurrentPlan(updatedPlan, startDate || new Date().toISOString());
            } else {
                alert("Keine anderen Frühstücks-Gerichte verfügbar!");
            }
            return;
        }

        if (slot === 'lunch') {
            const candidates = meals.filter(m => (!m.mealTypes || m.mealTypes.length === 0 || m.mealTypes.includes('main')) && m.id !== currentMeal?.id);
            if (candidates.length > 0) {
                const randomNew = candidates[Math.floor(Math.random() * candidates.length)];
                const updatedPlan = [...plan];
                updatedPlan[index] = {
                    ...updatedPlan[index],
                    lunch: { ...randomNew, isEaten: false }
                };
                await saveCurrentPlan(updatedPlan, startDate || new Date().toISOString());
            } else {
                alert("Keine anderen Gerichte verfügbar!");
            }
            return;
        }

        // slot === 'dinner'
        let targetCategory = desiredCategory;
        if (!targetCategory && currentMeal?.categories && currentMeal.categories.length > 0) {
            targetCategory = currentMeal.categories[0];
        }

        let candidates: Meal[] = [];
        const mainMeals = meals.filter(m => !m.mealTypes || m.mealTypes.length === 0 || m.mealTypes.includes('main'));
        if (targetCategory === 'brotzeit') {
            candidates = mainMeals.filter(m => m.id !== currentMeal?.id);
        } else {
            candidates = mainMeals.filter(m => m.categories && m.categories.includes(targetCategory as string) && m.id !== currentMeal?.id);
        }

        if (candidates.length > 0) {
            const randomNew = candidates[Math.floor(Math.random() * candidates.length)];
            const updatedPlan = [...plan];
            const updatedDinner = { ...randomNew, isEaten: false };
            updatedPlan[index] = {
                ...updatedPlan[index],
                dinner: updatedDinner
            };

            // "Mittagessen ist immer das essen vom Vortag":
            // When dinner at index changes, update next day's lunch!
            if (index < 6 && updatedPlan[index + 1]) {
                updatedPlan[index + 1] = {
                    ...updatedPlan[index + 1],
                    lunch: { ...randomNew, isEaten: false }
                };
            }

            await saveCurrentPlan(updatedPlan, startDate || new Date().toISOString());
        } else {
            alert("Keine anderen Gerichte in dieser Kategorie verfügbar!");
        }
    };

    const updatePlanMeal = async (index: number, slot: DaySlot, updates: Partial<Meal>) => {
        if (!plan[index] || !plan[index][slot]) return;
        const updatedPlan = [...plan];
        const updatedMeal = { ...updatedPlan[index][slot], ...updates };
        updatedPlan[index] = {
            ...updatedPlan[index],
            [slot]: updatedMeal
        };

        // If dinner image/name updated, also update next day's lunch if matching
        if (slot === 'dinner' && index < 6 && updatedPlan[index + 1]) {
            if (updatedPlan[index + 1].lunch.id === updatedMeal.id) {
                updatedPlan[index + 1] = {
                    ...updatedPlan[index + 1],
                    lunch: { ...updatedPlan[index + 1].lunch, ...updates }
                };
            }
        }

        await saveCurrentPlan(updatedPlan, startDate || new Date().toISOString());
    };

    const updateConfig = (key: string, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const clearPlan = async () => {
        setPlan([]);
        setStartDate(null);
        if (user) await savePlanService(user.uid, { days: [], startDate: null });
    };

    const toggleMealEaten = async (index: number, slot: DaySlot = 'dinner') => {
        if (!plan[index] || !plan[index][slot]) return;

        const updatedPlan = [...plan];
        const targetMeal = updatedPlan[index][slot];
        const isCurrentlyEaten = !!targetMeal.isEaten;
        const newEatenState = !isCurrentlyEaten;

        updatedPlan[index] = {
            ...updatedPlan[index],
            [slot]: {
                ...targetMeal,
                isEaten: newEatenState
            }
        };

        setPlan(updatedPlan);

        if (user) {
            try {
                await savePlanService(user.uid, {
                    days: updatedPlan,
                    startDate: startDate || new Date().toISOString()
                });
            } catch (e) {
                console.error("Failed to save plan after toggle", e);
            }
        }

        // If marking as eaten, update global lastEaten
        if (newEatenState) {
            try {
                if (!targetMeal.id.startsWith('brotzeit-') && !targetMeal.id.startsWith('placeholder-') && !targetMeal.id.startsWith('leftover-')) {
                    const today = new Date().toISOString();
                    await updateLastEatenDate(targetMeal.id, today);
                    await refreshMeals();
                }
            } catch (e) {
                console.error("Failed to update global lastEaten", e);
            }
        }
    };

    return { plan, startDate, config, updateConfig, generatePlan, swapMeal, updatePlanMeal, clearPlan, toggleMealEaten, loadingPlan };
};
