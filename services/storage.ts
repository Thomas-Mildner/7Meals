import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

export const uploadMealImage = async (mealId: string, imageUri: string): Promise<string> => {
    try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        const imageRef = ref(storage, `meals/${mealId}/image.jpg`);
        
        await uploadBytes(imageRef, blob);
        const downloadUrl = await getDownloadURL(imageRef);
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw error;
    }
};

export const deleteMealImage = async (mealId: string): Promise<void> => {
    try {
        const imageRef = ref(storage, `meals/${mealId}/image.jpg`);
        await deleteObject(imageRef);
    } catch (error) {
        console.error("Error deleting image: ", error);
        // It's okay if the image doesn't exist (e.g. object-not-found)
        throw error;
    }
};
