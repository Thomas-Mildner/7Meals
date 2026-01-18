import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Switch, Platform, ActionSheetIOS, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';
import DateTimePicker from './PlatformDateTimePicker';
import ConfirmModal from './ConfirmModal';
import { useTheme } from '../context/ThemeContext';

const DAYS = [
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
    const { theme, toggleTheme, colors } = useTheme();
    const [pushEnabled, setPushEnabled] = useState(false);
    const { registerForPushNotificationsAsync, scheduleWeeklyReminder, cancelAllNotifications } = usePushNotifications();

    // Default: Sunday 10:00 AM
    const [selectedDay, setSelectedDay] = useState(1);
    const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(10, 0, 0, 0)));
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDayPicker, setShowDayPicker] = useState(false);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);

    useEffect(() => {
        // Check stored preference instead of just permissions
        const checkStatus = async () => {
            try {
                const storedValue = await AsyncStorage.getItem('weeklyReminderEnabled');
                if (storedValue !== null) {
                    setPushEnabled(JSON.parse(storedValue));
                } else {
                    setPushEnabled(false); // Default to disabled
                }
            } catch (e) {
                console.log("Error loading reminder preference", e);
            }
        };
        checkStatus();
    }, [visible]);

    const getDayLabel = (val) => DAYS.find(d => d.value === val)?.label;

    const handleSchedule = async (enabled, day, time) => {
        try {
            if (enabled) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await scheduleWeeklyReminder(day, time.getHours(), time.getMinutes());
                    setPushEnabled(true);
                    await AsyncStorage.setItem('weeklyReminderEnabled', 'true');
                    setShowScheduleSuccess(true);
                } else {
                    Alert.alert("Berechtigung erforderlich", "Bitte aktiviere Benachrichtigungen in den Einstellungen.");
                    setPushEnabled(false);
                    await AsyncStorage.setItem('weeklyReminderEnabled', 'false');
                }
            } else {
                await cancelAllNotifications();
                setPushEnabled(false);
                await AsyncStorage.setItem('weeklyReminderEnabled', 'false');
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Fehler", "Ein unerwarteter Fehler ist aufgetreten: " + error.message);
            setPushEnabled(false);
            await AsyncStorage.setItem('weeklyReminderEnabled', 'false');
        }
    };

    const toggleSwitch = async () => {
        const newState = !pushEnabled;
        if (newState) {
            // Turning ON
            const settings = await Notifications.getPermissionsAsync();
            let hasPermission = settings.granted || settings.ios?.status === 3;

            if (!hasPermission) {
                const { status } = await Notifications.requestPermissionsAsync();
                hasPermission = status === 'granted';
            }

            if (hasPermission) {
                setPushEnabled(true);
                await AsyncStorage.setItem('weeklyReminderEnabled', 'true');
            } else {
                Alert.alert("Berechtigung erforderlich", "Bitte aktiviere Benachrichtigungen, um diese Funktion zu nutzen.");
                setPushEnabled(false);
                await AsyncStorage.setItem('weeklyReminderEnabled', 'false');
            }
        } else {
            // Turning OFF
            await cancelAllNotifications();
            setPushEnabled(false);
            await AsyncStorage.setItem('weeklyReminderEnabled', 'false');
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
        setShowLogoutConfirm(true);
    };

    // Dynamic styles
    const styles = getStyles(colors);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profil</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={40} color={colors.primary} />
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userLabel}>Angemeldet als</Text>
                            <Text style={styles.userEmail}>
                                {user?.isAnonymous ? "Demo-Nutzer" : user?.email || "Nutzer"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Darstellung</Text>
                        <View style={styles.menuItem}>
                            <View style={styles.menuItemIcon}>
                                <Ionicons name={theme === 'dark' ? "moon-outline" : "sunny-outline"} size={24} color={colors.text} />
                            </View>
                            <Text style={[styles.menuItemText, { flex: 1 }]}>Dunkelmodus</Text>
                            <Switch
                                trackColor={{ false: "#767577", true: colors.primary }}
                                thumbColor={theme === 'dark' ? "#f4f3f4" : "#f4f3f4"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={toggleTheme}
                                value={theme === 'dark'}
                            />
                        </View>
                    </View>

                    {Platform.OS !== 'web' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Einstellungen</Text>

                            <View style={styles.menuItem}>
                                <View style={styles.menuItemIcon}>
                                    <Ionicons name="notifications-outline" size={24} color={colors.text} />
                                </View>
                                <Text style={[styles.menuItemText, { flex: 1 }]}>Erinnerung planen</Text>
                                <Switch
                                    trackColor={{ false: "#767577", true: colors.primary }}
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
                                            <Ionicons name="calendar-outline" size={24} color={colors.text} />
                                        </View>
                                        <Text style={[styles.menuItemText, { flex: 1 }]}>Erinnerungstag</Text>
                                        <Text style={{ color: colors.primary, fontWeight: '600' }}>{getDayLabel(selectedDay)}</Text>
                                        <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>

                                    <View style={styles.menuItem}>
                                        <View style={styles.menuItemIcon}>
                                            <Ionicons name="time-outline" size={24} color={colors.text} />
                                        </View>
                                        <Text style={[styles.menuItemText, { flex: 1 }]}>Erinnerungszeit</Text>
                                        {Platform.OS === 'web' ? (
                                            <DateTimePicker
                                                testID="dateTimePicker"
                                                value={reminderTime}
                                                mode="time"
                                                is24Hour={true}
                                                display="default"
                                                onChange={onTimeChange}
                                                themeVariant={theme}
                                                style={{ minWidth: 100 }}
                                            />
                                        ) : (
                                            <>
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
                                                        themeVariant={theme}
                                                        style={Platform.OS === 'ios' ? { width: 100 } : undefined}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.menuItem, { backgroundColor: colors.primary, justifyContent: 'center', marginTop: 10 }]}
                                        onPress={() => handleSchedule(true, selectedDay, reminderTime)}
                                    >
                                        <Text style={[styles.menuItemText, { color: '#fff', fontWeight: 'bold' }]}>Zeitplan speichern</Text>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

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
                                <Ionicons name="code-slash-outline" size={24} color={colors.text} />
                            </View>
                            <Text style={styles.menuItemText}>Version {require('../package.json').version}</Text>
                        </View>
                    </View>
                </ScrollView>

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
                                        selectedDay === day.value && { color: colors.primary }
                                    ]}>
                                        {day.label}
                                    </Text>
                                    {selectedDay === day.value && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                <ConfirmModal
                    visible={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={() => {
                        onClose();
                        logout();
                    }}
                    title="Abmelden"
                    message="Möchtest du dich wirklich abmelden?"
                    confirmText="Abmelden"
                    type="destructive"
                />

                <ConfirmModal
                    visible={showScheduleSuccess}
                    onClose={() => setShowScheduleSuccess(false)}
                    onConfirm={() => setShowScheduleSuccess(false)}
                    title="Erfolg"
                    message={`Wöchentliche Erinnerung aktiviert!\nDu wirst jeden ${getDayLabel(selectedDay)} um ${reminderTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} benachrichtigt.`}
                    confirmText="OK"
                    cancelText={null}
                    type="default"
                />
            </View>
        </Modal>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
        color: colors.text,
    },
    closeButton: {
        padding: 5,
        backgroundColor: colors.card,
        borderRadius: 15,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 16,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        color: '#888',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    menuItemIcon: {
        marginRight: 16,
    },
    menuItemText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    timePickerButton: {
        backgroundColor: 'rgba(128,128,128,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    timePickerButtonText: {
        color: colors.primary,
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
        backgroundColor: colors.card,
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
        color: colors.text,
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
        borderBottomColor: 'rgba(128,128,128,0.1)',
    },
    dayOptionText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
});
