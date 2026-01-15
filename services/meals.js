import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const MEALS_COLLECTION = 'meals';

// Migrating 'category' (string) to 'categories' (array)
// Old: { name: '...', category: 'meat' }
// New: { name: '...', categories: ['meat', 'veg'] }

export const addMeal = async (name, categories, userId) => {
    try {
        const docRef = await addDoc(collection(db, MEALS_COLLECTION), {
            name,
            categories, // expects array
            userId,
            isFavorite: false,
            createdAt: new Date().toISOString(),
        });
        return { id: docRef.id, name, categories, userId, isFavorite: false };
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
