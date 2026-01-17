import { Stack } from 'expo-router';
import { Colors } from '../constants/Colors';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { MealProvider } from '../context/MealContext';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { messaging } from '../config/firebaseConfig';
import { getToken } from 'firebase/messaging';
import { Analytics } from '@vercel/analytics/next';

// Replace with your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push Certificates
const VAPID_KEY = process.env.EXPO_PUBLIC_VAPID_KEY;

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AppLayout />
        </ThemeProvider>
    );
}

function AppLayout() {
    const { colors, theme } = useTheme();
    const [loaded, error] = useFonts({
        ...Ionicons.font,
    });

    useEffect(() => {
        if (loaded || error) {
            // Hide splash screen if you were controlling it, or just proceed
        }
    }, [loaded, error]);

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
                    } else {
                        console.log('No registration token available.');
                    }
                })
                .catch(err => {
                    console.log('An error occurred while retrieving token. ', err);
                });
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === 'web') {
            // In case we want to re-inject standard stuff only once
            if (!document.getElementById('favicon-link')) {
                const link = document.createElement('link');
                link.id = 'favicon-link';
                link.rel = 'icon';
                link.href = '/assets/favicon.png';
                document.head.appendChild(link);

                const styleLink = document.createElement('link');
                styleLink.rel = 'stylesheet';
                styleLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/react-datepicker/4.25.0/react-datepicker.min.css';
                document.head.appendChild(styleLink);
            }
        }
    }, []);

    // Effect for dynamic theme CSS
    useEffect(() => {
        if (Platform.OS === 'web') {
            const existingStyle = document.getElementById('theme-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            const style = document.createElement('style');
            style.id = 'theme-styles';
            style.innerHTML = `
                /* Main Container */
                .react-datepicker, 
                .react-datepicker__time-container, 
                .react-datepicker__time-box {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                    background-color: ${colors.card} !important;
                    color: ${colors.text} !important;
                    border-color: ${theme === 'dark' ? '#444' : '#ddd'} !important;
                }

                /* Header */
                .react-datepicker__header,
                .react-datepicker__header--time {
                    background-color: ${theme === 'dark' ? '#1a1a1a' : '#f0f0f0'} !important;
                    border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#ddd'} !important;
                }

                /* Text Colors */
                .react-datepicker__current-month, 
                .react-datepicker-time__header,
                .react-datepicker-year-header,
                .react-datepicker__day-name,
                .react-datepicker__day {
                    color: ${colors.text} !important;
                }

                /* Time List */
                .react-datepicker__time-list {
                    background-color: ${colors.card} !important;
                    padding-bottom: 0 !important;
                }
                
                .react-datepicker__time-list-item {
                    color: ${colors.text} !important; 
                    background-color: ${colors.card} !important;
                    height: auto !important;
                    padding: 8px 10px !important;
                }

                /* Hover & Selection */
                .react-datepicker__time-list-item:hover {
                    background-color: ${theme === 'dark' ? '#333' : '#e0e0e0'} !important;
                    color: ${colors.text} !important;
                }
                .react-datepicker__time-list-item--selected,
                .react-datepicker__day--selected,
                .react-datepicker__day--keyboard-selected {
                    background-color: ${Colors.primary} !important;
                    color: #fff !important;
                    font-weight: bold !important;
                }

                /* Arrows */
                .react-datepicker__navigation-icon::before {
                    border-color: ${theme === 'dark' ? '#aaa' : '#666'} !important;
                }
                
                /* Triangle pointer removal/fix */
                .react-datepicker__triangle {
                    display: none !important;
                }
                
                /* Remove default borders */
                .react-datepicker__time-container {
                    border-left: none !important;
                    width: 120px !important;
                }
                .react-datepicker__time-box {
                    width: 100% !important;
                    border-radius: 0 0 4px 4px !important;
                }
                
                /* Input Field fix */
                .react-datepicker__input-container input {
                    color: ${colors.text} !important;
                }
            `;
            document.head.appendChild(style);
        }
    }, [colors, theme]);

    if (!loaded && !error) {
        return null;
    }

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

