import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarBackground: () => (
                    <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
                ),
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 60,
                    paddingBottom: 5,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="meals"
                options={{
                    title: 'Gerichte',
                    tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="plan"
                options={{
                    title: 'Wochenplan',
                    tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
