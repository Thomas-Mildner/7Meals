import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMeals, addMeal as addMealService, deleteMeal as deleteMealService, toggleMealFavorite, updateLastEatenDate, toggleMealShared, getSharedMealsByEmail, importMeal as importMealService, updateMeal as updateMealService } from '../services/meals';
import { useAuth } from './AuthContext';

const MealContext = createContext({});

export const useMealContext = () => useContext(MealContext);

export const MealProvider = ({ children }) => {
    const { user } = useAuth();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMeals = useCallback(async () => {
        if (!user) {
            setMeals([]);
            return;
        }
        setLoading(true);
        try {
            const data = await getMeals(user.uid);
            setMeals(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMeals();
    }, [fetchMeals]);

    const addMeal = async (name, categories, isShared = false, description = '') => {
        if (!user) return;

        // Check for duplicates (case-insensitive)
        const normalizedName = name.trim().toLowerCase();
        const exists = meals.some(m => m.name.trim().toLowerCase() === normalizedName);

        if (exists) {
            throw new Error("DUPLICATE_MEAL");
        }

        setLoading(true);

        try {
            const ownerEmail = user.email || '';
            await addMealService(name, categories, user.uid, ownerEmail, isShared, description);
            await fetchMeals();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeMeal = async (id) => {
        setLoading(true);
        try {
            await deleteMealService(id);
            await fetchMeals();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    const toggleFavorite = async (id, isFavorite) => {
        // Optimistic update
        setMeals(prev => prev.map(m => m.id === id ? { ...m, isFavorite } : m));
        try {
            await toggleMealFavorite(id, isFavorite);
        } catch (err) {
            setError(err);
            // Revert on error
            setMeals(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !isFavorite } : m));
        }
    };

    const markAsEaten = async (id) => {
        const today = new Date().toISOString();
        // Optimistic update
        setMeals(prev => prev.map(m => m.id === id ? { ...m, lastEaten: today } : m));
        try {
            await updateLastEatenDate(id, today);
        } catch (err) {
            setError(err);
            // Revert is harder here without previous date, assuming fail is rare.
            // Could fetchMeals() to restore.
            fetchMeals();
        }
    };

    const toggleShared = async (id, isShared) => {
        // Optimistic update
        setMeals(prev => prev.map(m => m.id === id ? { ...m, isShared } : m));
        try {
            await toggleMealShared(id, isShared);
        } catch (err) {
            setError(err);
            setMeals(prev => prev.map(m => m.id === id ? { ...m, isShared: !isShared } : m));
        }
    };

    const editMeal = async (id, updates) => {
        if (!user) return;

        // If name changed, check for duplicates
        if (updates.name) {
            const normalizedName = updates.name.trim().toLowerCase();
            const exists = meals.some(m => m.id !== id && m.name.trim().toLowerCase() === normalizedName);
            if (exists) {
                throw new Error("DUPLICATE_MEAL");
            }
        }

        // Optimistic update
        setMeals(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        try {
            await updateMealService(id, updates);
        } catch (err) {
            setError(err);
            await fetchMeals(); // revert
            throw err;
        }
    };

    const searchFriendMeals = async (email) => {
        try {
            return await getSharedMealsByEmail(email);
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const importFriendMeal = async (meal) => {
        if (!user) return;

        // Check for duplicates
        const normalizedName = meal.name.trim().toLowerCase();
        const exists = meals.some(m => m.name.trim().toLowerCase() === normalizedName);
        if (exists) {
            throw new Error("DUPLICATE_MEAL");
        }

        setLoading(true);
        try {
            const ownerEmail = user.email || '';
            await importMealService(meal, user.uid, ownerEmail);
            await fetchMeals();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <MealContext.Provider value={{ meals, loading, error, addMeal, removeMeal, toggleFavorite, markAsEaten, toggleShared, editMeal, searchFriendMeals, importFriendMeal, refreshMeals: fetchMeals }}>
            {children}
        </MealContext.Provider>
    );
};
