import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Switch, Platform, ActionSheetIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

const DAYS = [
    // Wait, ISO week day: 1 = Sunday? No, Notification trigger uses 1=Sunday usually
    // The previous code had 1=Sunday. German week starts Monday usually.
    // Let's keep the values consistent with Expo Notifications (1-7, 1=Sunday)
    { label: 'Sonntag', value: 1 },
    { label: 'Montag', value: 2 },
    { label: 'Dienstag', value: 3 },
    { label: 'Mittwoch', value: 4 },
    { label: 'Donnerstag', value: 5 },
    { label: 'Freitag', value: 6 },
    { label: 'Samstag', value: 7 },
];

export default function ProfileModal({ visible, onClose }) {
    const { user, logout } = useAuth();
    const [pushEnabled, setPushEnabled] = useState(false);
    const { registerForPushNotificationsAsync, scheduleWeeklyReminder, cancelAllNotifications } = usePushNotifications();

    // Default: Sunday 10:00 AM
    const [selectedDay, setSelectedDay] = useState(1);
    const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(10, 0, 0, 0)));
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDayPicker, setShowDayPicker] = useState(false);

    useEffect(() => {
        // Check initial permission status to set toggle correctly
        const checkStatus = async () => {
            const settings = await Notifications.getPermissionsAsync();
            setPushEnabled(settings.granted || settings.ios?.status === 3); // 3 is provisional
        };
        checkStatus();
    }, [visible]);

    const getDayLabel = (val) => DAYS.find(d => d.value === val)?.label;

    const handleSchedule = async (enabled, day, time) => {
        if (enabled) {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await scheduleWeeklyReminder(day, time.getHours(), time.getMinutes());
                setPushEnabled(true);
                Alert.alert("Erfolg", `Wöchentliche Erinnerung aktiviert! Du wirst jeden ${getDayLabel(day)} um ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} benachrichtigt.`);
            } else {
                Alert.alert("Berechtigung erforderlich", "Bitte aktiviere Benachrichtigungen in den Einstellungen.");
                setPushEnabled(false);
            }
        } else {
            await cancelAllNotifications();
            setPushEnabled(false);
        }
    };

    const toggleSwitch = async () => {
        const newState = !pushEnabled;
        if (newState) {
            // Just turn on visually
            // We won't schedule yet until the user hits "Save Schedule"
            // BUT if we want it to be "on" immediately with defaults, we can.
            // However, user said "every change triggers this log", implying they are in the picker flow.
            // If we decouple completely, 'toggleSwitch' just sets enabled state.
            // But we need to make sure we have permissions first.
            const settings = await Notifications.getPermissionsAsync();
            if (settings.granted || settings.ios?.status === 3) {
                setPushEnabled(true);
            } else {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status === 'granted') {
                    setPushEnabled(true);
                } else {
                    Alert.alert("Berechtigung erforderlich", "Bitte aktiviere Benachrichtigungen, um diese Funktion zu nutzen.");
                    setPushEnabled(false);
                }
            }
        } else {
            // Turning OFF
            await cancelAllNotifications();
            setPushEnabled(false);
        }
    };

    const onTimeChange = (event, selectedDate) => {
        const currentDate = selectedDate || reminderTime;
        setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS (inline), close on Android
        setReminderTime(currentDate);
    };

    const showDayActionSheet = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [...DAYS.map(d => d.label), 'Abbrechen'],
                    cancelButtonIndex: 7,
                    title: 'Erinnerungstag wählen'
                },
                (buttonIndex) => {
                    if (buttonIndex < 7) {
                        const newDay = DAYS[buttonIndex].value;
                        setSelectedDay(newDay);
                    }
                }
            );
        } else {
            setShowDayPicker(true);
        }
    };

    const handleDaySelect = (val) => {
        setSelectedDay(val);
        setShowDayPicker(false);
    };

    const handleLogout = () => {
        Alert.alert(
            "Abmelden",
            "Möchtest du dich wirklich abmelden?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Abmelden", style: "destructive", onPress: () => {
                        onClose();
                        logout();
                    }
                }
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profil</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={40} color={Colors.primary} />
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userLabel}>Angemeldet als</Text>
                            <Text style={styles.userEmail}>
                                {user?.isAnonymous ? "Gastnutzer" : user?.email || "Nutzer"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Einstellungen</Text>

                        <View style={styles.menuItem}>
                            <View style={styles.menuItemIcon}>
                                <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                            </View>
                            <Text style={[styles.menuItemText, { flex: 1 }]}>Erinnerung planen</Text>
                            <Switch
                                trackColor={{ false: "#767577", true: Colors.primary }}
                                thumbColor={pushEnabled ? "#f4f3f4" : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleSwitch}
                                value={pushEnabled}
                            />
                        </View>



                        {pushEnabled && (
                            <>
                                <TouchableOpacity style={styles.menuItem} onPress={showDayActionSheet}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons name="calendar-outline" size={24} color={Colors.text} />
                                    </View>
                                    <Text style={[styles.menuItemText, { flex: 1 }]}>Erinnerungstag</Text>
                                    <Text style={{ color: Colors.primary, fontWeight: '600' }}>{getDayLabel(selectedDay)}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                                <View style={styles.menuItem}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons name="time-outline" size={24} color={Colors.text} />
                                    </View>
                                    <Text style={[styles.menuItemText, { flex: 1 }]}>Erinnerungszeit</Text>
                                    <TouchableOpacity
                                        style={styles.timePickerButton}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Text style={styles.timePickerButtonText}>
                                            {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>

                                    {(showTimePicker || Platform.OS === 'ios') && (
                                        <DateTimePicker
                                            testID="dateTimePicker"
                                            value={reminderTime}
                                            mode="time"
                                            is24Hour={true}
                                            display="default"
                                            onChange={onTimeChange}
                                            themeVariant="dark"
                                            style={Platform.OS === 'ios' ? { width: 100 } : undefined}
                                        />
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.menuItem, { backgroundColor: Colors.primary, justifyContent: 'center', marginTop: 10 }]}
                                    onPress={() => handleSchedule(true, selectedDay, reminderTime)}
                                >
                                    <Text style={[styles.menuItemText, { color: '#fff', fontWeight: 'bold' }]}>Zeitplan speichern</Text>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Konto</Text>
                        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                            <View style={styles.menuItemIcon}>
                                <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
                            </View>
                            <Text style={[styles.menuItemText, { color: '#ff6b6b' }]}>Abmelden</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>App Info</Text>
                        <View style={styles.menuItem}>
                            <View style={styles.menuItemIcon}>
                                <Ionicons name="code-slash-outline" size={24} color={Colors.text} />
                            </View>
                            <Text style={styles.menuItemText}>Version 1.0.0</Text>
                        </View>
                    </View>
                </View>

                {/* Android Day Picker Modal */}
                <Modal visible={showDayPicker} transparent animationType="fade">
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowDayPicker(false)}
                    >
                        <View style={styles.dayPickerContent}>
                            <Text style={styles.dayPickerTitle}>Tag wählen</Text>
                            {DAYS.map((day) => (
                                <TouchableOpacity
                                    key={day.value}
                                    style={styles.dayOption}
                                    onPress={() => handleDaySelect(day.value)}
                                >
                                    <Text style={[
                                        styles.dayOptionText,
                                        selectedDay === day.value && { color: Colors.primary }
                                    ]}>
                                        {day.label}
                                    </Text>
                                    {selectedDay === day.value && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 15,
    },
    content: {
        flex: 1,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 20,
        borderRadius: 16,
        marginBottom: 30,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(42, 157, 143, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 2,
    },
    userEmail: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        color: '#666',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    menuItemIcon: {
        marginRight: 16,
    },
    menuItemText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    timePickerButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    timePickerButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    dayPickerContent: {
        backgroundColor: Colors.card,
        width: '100%',
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    dayPickerTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    dayOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    dayOptionText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
});
