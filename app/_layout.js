import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { MealProvider } from '../context/MealContext';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { messaging } from '../config/firebaseConfig';
import { getToken } from 'firebase/messaging';

// Replace with your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push Certificates
const VAPID_KEY = "jp18ON7nruwMiUbuGke2oeaAqIYILAis3nj09MiHGYM";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    useEffect(() => {
        if (Platform.OS === 'web' && messaging) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                    return getToken(messaging, {
                        vapidKey: VAPID_KEY,
                        serviceWorkerRegistration: registration,
                    });
                })
                .then(token => {
                    if (token) {
                        console.log('Web Push Token:', token);
                        // TODO: Send this token to your server or save it
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                })
                .catch(err => {
                    console.log('An error occurred while retrieving token. ', err);
                });
        }
    }, []);

    return (

        <AuthProvider>
            <MealProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                </Stack>
            </MealProvider>
        </AuthProvider>

    );
}

