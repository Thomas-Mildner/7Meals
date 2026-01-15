import { addMeal } from '../services/meals';

const DEMO_MEALS = [
    { name: 'Käsespätzle', category: 'veg' },
    { name: 'Schnitzel mit Pommes', category: 'meat' },
    { name: 'Lachs mit Spinat', category: 'fish' },
    { name: 'Gemüsecurry', category: 'veg' },
    { name: 'Rindergulasch', category: 'meat' },
    { name: 'Forelle Müllerin', category: 'fish' },
    { name: 'Kartoffelsuppe', category: 'veg' },
    { name: 'Currywurst', category: 'meat' },
    { name: 'Bratwurst mit Sauerkraut', category: 'meat' },
    { name: 'Thunfischsalat', category: 'fish' },
];

export const seedDatabase = async (userId) => {
    try {
        const promises = DEMO_MEALS.map(meal => addMeal(meal.name, meal.category, userId));
        await Promise.all(promises);
        console.log('Demo meals added successfully');
        return true;
    } catch (error) {
        console.error('Error seeding database:', error);
        return false;
    }
};
