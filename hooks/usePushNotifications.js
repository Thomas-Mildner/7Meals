import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);

    const registerForPushNotificationsAsync = async () => {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice || Platform.OS === 'web') {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                // Permission not granted
                return null;
            }

            try {
                // Hardcoded VAPID key for now to match _layout.js
                const projectId = 'f5ac5617-dbb7-4e55-aa2e-59edb1dd66dc'; // From app.json
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId,
                    vapidKey: 'jp18ON7nruwMiUbuGke2oeaAqIYILAis3nj09MiHGYM'
                })).data;
            } catch (e) {
                console.log("Error fetching push token:", e);
                // Even if token fails, we return a dummy string so local notifications might still work
                // if permissions were granted.
                token = "local-permission-granted";
            }
        } else {
            console.log('Must use physical device for Push Notifications');
            return "simulator-token";
        }

        return token;
    };

    const scheduleWeeklyReminder = async (weekday = 1, hour = 10, minute = 0) => {
        if (Platform.OS === 'web') {
            console.log("Web notification scheduling simulated:", { weekday, hour, minute });
            return;
        }

        // Cancel all existing to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        const trigger = {
            type: 'weekly',
            weekday: Number(weekday),
            hour: Number(hour),
            minute: Number(minute),
            repeats: true,
        };

        console.log("Scheduling notification with trigger:", JSON.stringify(trigger));

        try {
            // Schedule for specified day and time
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Plane deine Mahlzeiten! 🥗",
                    body: "Nimm dir einen Moment Zeit, um deine Mahlzeiten für die kommende Woche zu planen.",
                    sound: true,
                },
                trigger,
            });
            console.log("Notification scheduled successfully");
        } catch (error) {
            console.error("Error scheduling notification:", error);
            Alert.alert("Fehler", "Erinnerung konnte nicht geplant werden.");
        }
    };

    const cancelAllNotifications = async () => {
        if (Platform.OS === 'web') return;
        await Notifications.cancelAllScheduledNotificationsAsync();
    };

    return {
        registerForPushNotificationsAsync,
        scheduleWeeklyReminder,
        cancelAllNotifications,
        expoPushToken,
        notification
    };
};
