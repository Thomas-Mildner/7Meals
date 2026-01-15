import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDnI55SQ9P5TixQsfridnIJxb9ZBE0HvEg",
    authDomain: "meals-af1c6.firebaseapp.com",
    projectId: "meals-af1c6",
    storageBucket: "meals-af1c6.firebasestorage.app",
    messagingSenderId: "153120469629",
    appId: "1:153120469629:web:f38224f0a727da7de87714",
    measurementId: "G-DH496B0SBQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
