import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightScheme, DarkScheme } from '../constants/Colors';
import { ThemeContextType } from '../types';

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // Default to dark mode as it was the original app design
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('userTheme');
            if (savedTheme) {
                setTheme(savedTheme as 'light' | 'dark');
            }
        } catch (e) {
            console.log('Failed to load theme:', e);
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem('userTheme', newTheme);
        } catch (e) {
            console.log('Failed to save theme:', e);
        }
    };

    const colors = theme === 'light' ? LightScheme : DarkScheme;

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
