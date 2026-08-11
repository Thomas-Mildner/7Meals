import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where, deleteField } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Meal } from '../types';

const MEALS_COLLECTION = 'meals';

// Migrating 'category' (string) to 'categories' (array)
// Old: { name: '...', category: 'meat' }
// New: { name: '...', categories: ['meat', 'veg'] }

export const addMeal = async (name: string, categories: string[], userId: string, ownerEmail = '', isShared = false, description = ''): Promise<Meal> => {
    try {
        const docRef = await addDoc(collection(db, MEALS_COLLECTION), {
            name,
            categories, // expects array
            userId,
            ownerEmail: ownerEmail.toLowerCase(),
            isShared,
            description,
            isFavorite: false,
            createdAt: new Date().toISOString(),
        });
        return { id: docRef.id, name, categories, userId, ownerEmail: ownerEmail.toLowerCase(), isShared, description, isFavorite: false };
    } catch (error) {
        console.error("Error adding meal: ", error);
        throw error;
    }
};

export const getMeals = async (userId: string): Promise<Meal[]> => {
    try {
        const q = query(collection(db, MEALS_COLLECTION), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const meals: Meal[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Data Normalization (Backwards Compatibility)
            let categories = data.categories || [];
            if (categories.length === 0 && data.category) {
                categories = [data.category];
            }
            meals.push({ id: doc.id, ...data, categories } as Meal);
        });
        return meals;
    } catch (error) {
        console.error("Error getting meals: ", error);
        throw error;
    }
};

export const deleteMeal = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, MEALS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting meal: ", error);
        throw error;
    }
}

export const toggleMealFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
    try {
        const mealRef = doc(db, MEALS_COLLECTION, id);
        await updateDoc(mealRef, {
            isFavorite: isFavorite
        });
    } catch (error) {
        console.error("Error toggling favorite: ", error);
        throw error;
    }
};

export const updateLastEatenDate = async (id: string, date: string): Promise<void> => {
    try {
        const mealRef = doc(db, MEALS_COLLECTION, id);
        await updateDoc(mealRef, {
            lastEaten: date
        });
    } catch (error) {
        console.error("Error updating last eaten: ", error);
        throw error;
    }
};

export const updateMeal = async (id: string, { name, categories, description, isShared, imageUrl }: Partial<Meal>): Promise<void> => {
    try {
        const mealRef = doc(db, MEALS_COLLECTION, id);
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (categories !== undefined) updates.categories = categories;
        if (description !== undefined) updates.description = description;
        if (isShared !== undefined) updates.isShared = isShared;
        if (imageUrl !== undefined) {
            updates.imageUrl = imageUrl === null ? deleteField() : imageUrl;
        }
        updates.updatedAt = new Date().toISOString();
        await updateDoc(mealRef, updates);
    } catch (error) {
        console.error("Error updating meal: ", error);
        throw error;
    }
};

export const toggleMealShared = async (id: string, isShared: boolean, ownerEmail = ''): Promise<void> => {
    try {
        const mealRef = doc(db, MEALS_COLLECTION, id);
        const updates: any = { isShared };
        if (ownerEmail) {
            updates.ownerEmail = ownerEmail.toLowerCase();
        }
        await updateDoc(mealRef, updates);
    } catch (error) {
        console.error("Error toggling shared: ", error);
        throw error;
    }
};

export const getSharedMealsByEmail = async (email: string): Promise<Meal[]> => {
    try {
        // Query only by ownerEmail to avoid Firestore composite index requirement
        // Filter isShared client-side
        const q = query(
            collection(db, MEALS_COLLECTION),
            where("ownerEmail", "==", email.toLowerCase())
        );
        const querySnapshot = await getDocs(q);
        const meals: Meal[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Only include shared meals
            if (data.isShared !== true) return;
            let categories = data.categories || [];
            if (categories.length === 0 && data.category) {
                categories = [data.category];
            }
            meals.push({ id: docSnap.id, ...data, categories } as Meal);
        });
        return meals;
    } catch (error) {
        console.error("Error getting shared meals: ", error);
        throw error;
    }
};

export const importMeal = async (meal: Partial<Meal>, userId: string, ownerEmail: string): Promise<Meal> => {
    try {
        const docRef = await addDoc(collection(db, MEALS_COLLECTION), {
            name: meal.name,
            categories: meal.categories || [],
            description: meal.description || '',
            userId,
            ownerEmail: ownerEmail.toLowerCase(),
            isShared: false,
            isFavorite: false,
            createdAt: new Date().toISOString(),
        });
        return { id: docRef.id, name: meal.name || '', categories: meal.categories || [], description: meal.description || '', userId, ownerEmail: ownerEmail.toLowerCase(), isShared: false, isFavorite: false };
    } catch (error) {
        console.error("Error importing meal: ", error);
        throw error;
    }
};
