import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';
import * as ImageManipulator from 'expo-image-manipulator';

export const compressImage = async (imageUri: string): Promise<string> => {
    try {
        const result = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 1024 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    } catch (error) {
        console.warn("Could not compress image, falling back to original uri: ", error);
        return imageUri;
    }
};

export const uploadMealImage = async (mealId: string, imageUri: string): Promise<string> => {
    try {
        const optimizedUri = await compressImage(imageUri);
        const response = await fetch(optimizedUri);
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
