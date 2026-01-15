import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const PLANS_COLLECTION = 'plans';

export const savePlan = async (userId, planData) => {
    try {
        const planRef = doc(db, PLANS_COLLECTION, userId);
        await setDoc(planRef, {
            ...planData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving plan: ", error);
        throw error;
    }
};

export const getPlan = async (userId) => {
    try {
        const planRef = doc(db, PLANS_COLLECTION, userId);
        const docSnap = await getDoc(planRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting plan: ", error);
        throw error;
    }
};
