import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ImpressumScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Impressum</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>Angaben gemäß § 5 TMG</Text>

                <Text style={[styles.text, { color: colors.text }]}>
                    Thomas Mildner{'\n'}
                </Text>

                <Text style={[styles.subtitle, { color: colors.text }]}>Kontakt</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    E-Mail: <Text style={{ color: colors.primary, textDecorationLine: 'underline' }} onPress={() => Linking.openURL('mailto:kontakt@mildner-thomas.de')}>kontakt@mildner-thomas.de</Text>
                </Text>

                <Text style={[styles.subtitle, { color: colors.text }]}>Verbraucher­streit­beilegung/Universal­schlichtungs­stelle</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </Text>

                <Text style={[styles.subtitle, { color: colors.text }]}>Haftung für Inhalte</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </Text>
                <Text style={[styles.text, { color: colors.text }]}>
                    Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
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
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 8,
    },
    text: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    }
});
