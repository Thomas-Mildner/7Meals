import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMeals, addMeal as addMealService, deleteMeal as deleteMealService, toggleMealFavorite, updateLastEatenDate } from '../services/meals';
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

    const addMeal = async (name, categories) => {
        if (!user) return;

        // Check for duplicates (case-insensitive)
        const normalizedName = name.trim().toLowerCase();
        const exists = meals.some(m => m.name.trim().toLowerCase() === normalizedName);

        if (exists) {
            throw new Error("DUPLICATE_MEAL");
        }

        setLoading(true);

        try {
            await addMealService(name, categories, user.uid);
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

    return (
        <MealContext.Provider value={{ meals, loading, error, addMeal, removeMeal, toggleFavorite, markAsEaten, refreshMeals: fetchMeals }}>
            {children}
        </MealContext.Provider>
    );
};
