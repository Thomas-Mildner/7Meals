import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    // Mode: 'login' | 'register'
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { loginWithEmail, registerWithEmail, loginAnonymously } = useAuth();

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert("Fehler", "Bitte alle Felder ausfüllen");
            return;
        }
        setIsLoading(true);
        try {
            if (mode === 'login') {
                await loginWithEmail(email, password);
            } else {
                await registerWithEmail(email, password);
            }
        } catch (error) {
            Alert.alert("Authentifizierung fehlgeschlagen", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuest = async () => {
        setIsLoading(true);
        try {
            await loginAnonymously();
        } catch (error) {
            Alert.alert("Fehler", "Anmeldung als Gast fehlgeschlagen.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#264653', '#1D3557']}
                style={styles.background}
            />

            <View style={styles.contentContainer}>

                <View style={styles.headerContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="restaurant" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.appName}>7MEALS</Text>
                    <Text style={styles.tagline}>Plane deine Woche, iss besser.</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity style={[styles.tab, mode === 'login' && styles.activeTab]} onPress={() => setMode('login')}>
                            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Anmelden</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, mode === 'register' && styles.activeTab]} onPress={() => setMode('register')}>
                            <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Registrieren</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-Mail"
                            placeholderTextColor="#888"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Passwort"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.mainButtonText}>{mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleGuest} disabled={isLoading} style={styles.guestButton}>
                        <Text style={styles.guestButtonText}>Als Gast fortfahren</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>oder weiter mit</Text>
                        <View style={styles.line} />
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Demnächst", "Google Login muss noch konfiguriert werden.")}>
                            <Ionicons name="logo-google" size={24} color="#DB4437" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Demnächst", "Apple Login muss noch konfiguriert werden.")}>
                            <Ionicons name="logo-apple" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 2,
    },
    tagline: {
        color: '#ccc',
        fontSize: 16,
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        paddingVertical: 16,
        fontSize: 16,
    },
    mainButton: {
        backgroundColor: Colors.secondary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    mainButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    guestButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    guestButtonText: {
        color: '#ccc',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
        color: '#666',
        marginHorizontal: 16,
        fontSize: 12,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }
});
