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

        if (Device.isDevice) {
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

            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            console.log('Must use physical device for Push Notifications');
            // Return dummy token for simulator testing of local notifications
            return "simulator-token";
        }

        return token;
    };

    const scheduleWeeklyReminder = async (weekday = 1, hour = 10, minute = 0) => {
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
