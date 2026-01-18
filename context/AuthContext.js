import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useRouter, useSegments } from 'expo-router';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)/meals');
        }
    }, [user, loading, segments]);

    const loginAnonymously = async () => {
        try {
            const result = await signInAnonymously(auth);
            // Auto-seed for demo mode
            const { seedDatabase } = await import('../utils/seed');
            await seedDatabase(result.user.uid);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
    const loginWithCredential = (credential) => signInWithCredential(auth, credential);
    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loading, loginAnonymously, loginWithEmail, registerWithEmail, loginWithCredential, googleProvider: new GoogleAuthProvider(), logout }}>
            {children}
        </AuthContext.Provider>
    );
};
