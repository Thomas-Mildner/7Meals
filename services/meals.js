import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const MEALS_COLLECTION = 'meals';

// Migrating 'category' (string) to 'categories' (array)
// Old: { name: '...', category: 'meat' }
// New: { name: '...', categories: ['meat', 'veg'] }

export const addMeal = async (name, categories, userId, ownerEmail = '', isShared = false, description = '') => {
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

export const getMeals = async (userId) => {
    try {
        const q = query(collection(db, MEALS_COLLECTION), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const meals = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Data Normalization (Backwards Compatibility)
            let categories = data.categories || [];
            if (categories.length === 0 && data.category) {
                categories = [data.category];
            }
            meals.push({ id: doc.id, ...data, categories });
        });
        return meals;
    } catch (error) {
        console.error("Error getting meals: ", error);
        throw error;
    }
};

export const deleteMeal = async (id) => {
    try {
        await deleteDoc(doc(db, MEALS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting meal: ", error);
        throw error;
    }
}

export const toggleMealFavorite = async (id, isFavorite) => {
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

export const updateLastEatenDate = async (id, date) => {
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

export const updateMeal = async (id, { name, categories, description, isShared }) => {
    try {
        const mealRef = doc(db, MEALS_COLLECTION, id);
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (categories !== undefined) updates.categories = categories;
        if (description !== undefined) updates.description = description;
        if (isShared !== undefined) updates.isShared = isShared;
        updates.updatedAt = new Date().toISOString();
        await updateDoc(mealRef, updates);
    } catch (error) {
        console.error("Error updating meal: ", error);
        throw error;
    }
};

export const toggleMealShared = async (id, isShared) => {
    try {
        const mealRef = doc(db, MEALS_COLLECTION, id);
        await updateDoc(mealRef, { isShared });
    } catch (error) {
        console.error("Error toggling shared: ", error);
        throw error;
    }
};

export const getSharedMealsByEmail = async (email) => {
    try {
        const q = query(
            collection(db, MEALS_COLLECTION),
            where("ownerEmail", "==", email.toLowerCase()),
            where("isShared", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const meals = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let categories = data.categories || [];
            if (categories.length === 0 && data.category) {
                categories = [data.category];
            }
            meals.push({ id: docSnap.id, ...data, categories });
        });
        return meals;
    } catch (error) {
        console.error("Error getting shared meals: ", error);
        throw error;
    }
};

export const importMeal = async (meal, userId, ownerEmail) => {
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
        return { id: docRef.id, name: meal.name, categories: meal.categories || [], description: meal.description || '', userId, ownerEmail: ownerEmail.toLowerCase(), isShared: false, isFavorite: false };
    } catch (error) {
        console.error("Error importing meal: ", error);
        throw error;
    }
};
