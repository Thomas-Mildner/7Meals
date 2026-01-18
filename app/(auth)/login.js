import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    // Mode: 'login' | 'register'
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { loginWithEmail, registerWithEmail, loginAnonymously, loginWithCredential, googleProvider } = useAuth();
    const { colors, theme } = useTheme();

    // Dynamic styles
    const styles = getStyles(colors, theme);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '153120469629-eg71199k32r5vn5tf4m6nqqnc01dcoua.apps.googleusercontent.com',
        iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // Placeholder
        androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontet.com', // Placeholder
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setIsLoading(true);
            loginWithCredential(credential)
                .catch((error) => {
                    Alert.alert("Google Login fehlgeschlagen", error.message);
                })
                .finally(() => setIsLoading(false));
        }
    }, [response]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            if (Platform.OS === 'web') {
                await signInWithPopup(auth, googleProvider);
            } else {
                await promptAsync();
            }
        } catch (error) {
            Alert.alert("Google Login Fehler", error.message);
        } finally {
            if (Platform.OS === 'web') setIsLoading(false);
        }
    };

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
            Alert.alert("Fehler", "Anmeldung für Demo Zugang fehlgeschlagen.");
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
                // Dark: Dark BG -> Dark Card (Blueish)
                // Light: Light BG -> White
                colors={theme === 'dark' ? ['#264653', '#1D3557'] : ['#e0f7fa', '#ffffff']}
                style={styles.background}
            />

            <View style={styles.contentContainer}>

                <View style={styles.headerContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="restaurant" size={40} color={colors.primary} />
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
                        <Ionicons name="mail-outline" size={20} color={theme === 'dark' ? "#888" : "#666"} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="E-Mail"
                            placeholderTextColor={theme === 'dark' ? "#888" : "#999"}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme === 'dark' ? "#888" : "#666"} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Passwort"
                            placeholderTextColor={theme === 'dark' ? "#888" : "#999"}
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
                        <Text style={styles.guestButtonText}>Demo Zugang</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>oder weiter mit</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <View style={styles.googleButtonContent}>
                            <Ionicons name="logo-google" size={24} color="#DB4437" style={{ marginRight: 12 }} />
                            <Text style={styles.googleButtonText}>Weiter mit Google</Text>
                        </View>
                    </TouchableOpacity>

                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors, theme) => StyleSheet.create({
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
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 2,
    },
    tagline: {
        color: theme === 'dark' ? '#ccc' : '#555',
        fontSize: 16,
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
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
        backgroundColor: colors.primary,
    },
    tabText: {
        color: theme === 'dark' ? '#888' : '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : '#fff',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#eee',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: colors.text,
        paddingVertical: 16,
        fontSize: 16,
    },
    mainButton: {
        backgroundColor: colors.secondary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    mainButtonText: {
        color: '#fff', // Secondary is usually bright enough for white text
        fontWeight: 'bold',
        fontSize: 16,
    },
    guestButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    guestButtonText: {
        color: theme === 'dark' ? '#ccc' : '#666',
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
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    dividerText: {
        color: theme === 'dark' ? '#666' : '#888',
        marginHorizontal: 16,
        fontSize: 12,
    },
    googleButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    googleButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    }
});
