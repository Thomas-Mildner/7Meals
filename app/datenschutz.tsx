import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DatenschutzScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Datenschutzerklärung</Text>
                <View style={{ width: 40 }} />
            </View>
            
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                
                <Text style={[styles.title, { color: colors.text }]}>1. Datenschutz auf einen Blick</Text>
                
                <Text style={[styles.subtitle, { color: colors.text }]}>Allgemeine Hinweise</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit deinen personenbezogenen Daten passiert, wenn du diese App nutzt. Personenbezogene Daten sind alle Daten, mit denen du persönlich identifiziert werden kannst.
                </Text>

                <Text style={[styles.subtitle, { color: colors.text }]}>Datenerfassung in dieser App</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Die Datenverarbeitung in dieser App erfolgt durch den App-Betreiber (siehe Impressum).
                </Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Wir erfassen Daten, die du uns mitteilst. Hierbei handelt es sich z. B. um Daten (E-Mail-Adresse), die du bei der Registrierung eingibst. Zudem speichern wir die von dir erstellten Inhalte (Gerichte, Bilder, Wochenpläne), um die Funktionalität der App zu gewährleisten.
                </Text>

                <Text style={[styles.title, { color: colors.text }]}>2. Hosting und Dienste von Drittanbietern</Text>
                
                <Text style={[styles.subtitle, { color: colors.text }]}>Vercel (Hosting)</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Wir hosten unsere App bei Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA). 
                    Wenn du unsere App besuchst, erfasst Vercel verschiedene Logfiles inklusive deiner IP-Adressen.
                    Die Verwendung von Vercel erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer App.
                </Text>

                <Text style={[styles.subtitle, { color: colors.text }]}>Firebase (Google)</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Wir nutzen für diese App Dienste der Google-Plattform "Firebase" (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland).
                    Firebase bietet verschiedene Dienste an, die wir für den Betrieb der App nutzen:
                </Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    - <Text style={{fontWeight: 'bold'}}>Firebase Authentication</Text>: Zur sicheren Anmeldung (Registrierung per E-Mail oder Google-Login). Hierbei werden E-Mail-Adressen und ggf. Profilinformationen (bei Google-Login) verarbeitet.{'\n'}
                    - <Text style={{fontWeight: 'bold'}}>Cloud Firestore</Text>: Zum Speichern deiner Gerichte, Pläne und App-Einstellungen.{'\n'}
                    - <Text style={{fontWeight: 'bold'}}>Firebase Storage</Text>: Zum Speichern der von dir hochgeladenen Bilder.
                </Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Die Nutzung dieser Dienste erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der App-Betreiber hat ein berechtigtes Interesse an einer möglichst sicheren und zuverlässigen Bereitstellung der App-Funktionen.
                </Text>

                <Text style={[styles.title, { color: colors.text }]}>3. Deine Rechte</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Du hast jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck deiner gespeicherten personenbezogenen Daten zu erhalten. Du hast außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Du kannst deine Daten in der App selbstständig bearbeiten oder löschen (z.B. Konto löschen, Gerichte löschen). Bei Fragen zum Datenschutz kannst du dich jederzeit an uns wenden (Kontakt siehe Impressum).
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
    },
    text: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    }
});
