import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { MealProvider } from '../context/MealContext';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
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
