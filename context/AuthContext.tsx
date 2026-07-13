import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCredential, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useRouter, useSegments } from 'expo-router';
import { AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
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

    const loginWithEmail = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
    const registerWithEmail = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
    const loginWithCredential = (credential: any) => signInWithCredential(auth, credential);
    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loading, loginAnonymously, loginWithEmail, registerWithEmail, loginWithCredential, googleProvider: new GoogleAuthProvider(), logout }}>
            {children}
        </AuthContext.Provider>
    );
};
