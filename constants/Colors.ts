const Common = {
    primary: '#2A9D8F',
    secondary: '#E9C46A',
    accent: '#E76F51',
    meat: '#E76F51',
    fish: '#457B9D',
    veg: '#2A9D8F',
    brotzeit: '#A68A64',
};

export const DarkScheme = {
    ...Common,
    background: '#264653',
    text: '#FFFFFF',
    card: '#1D3557',
};

export const LightScheme = {
    ...Common,
    background: '#F8F9FA',
    text: '#1D3557',
    card: '#FFFFFF',
};

// Default export for backward compatibility during refactor
export const Colors = DarkScheme;
