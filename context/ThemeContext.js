import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightScheme, DarkScheme } from '../constants/Colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Default to dark mode as it was the original app design
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('userTheme');
            if (savedTheme) {
                setTheme(savedTheme);
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
