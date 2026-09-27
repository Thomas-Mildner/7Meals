import { addMeal } from '../services/meals';
import { MealType } from '../types';

interface DemoMeal {
    name: string;
    category: string;
    mealTypes?: MealType[];
}

const DEMO_MEALS: DemoMeal[] = [
    { name: 'Käsespätzle', category: 'veg', mealTypes: ['main'] },
    { name: 'Schnitzel mit Pommes', category: 'meat', mealTypes: ['main'] },
    { name: 'Lachs mit Spinat', category: 'fish', mealTypes: ['main'] },
    { name: 'Gemüsecurry', category: 'veg', mealTypes: ['main'] },
    { name: 'Rindergulasch', category: 'meat', mealTypes: ['main'] },
    { name: 'Forelle Müllerin', category: 'fish', mealTypes: ['main'] },
    { name: 'Kartoffelsuppe', category: 'veg', mealTypes: ['main'] },
    { name: 'Currywurst', category: 'meat', mealTypes: ['main'] },
    { name: 'Brotzeitplatte', category: 'brotzeit', mealTypes: ['main'] },
    { name: 'Wurstsalat', category: 'meat', mealTypes: ['main'] },
    { name: 'Thunfischsalat', category: 'fish', mealTypes: ['main'] },
    { name: 'Spaghetti Carbonara', category: 'meat', mealTypes: ['main'] },
    { name: 'Linseneintopf', category: 'veg', mealTypes: ['main'] },
    { name: 'Gebackener Camembert', category: 'veg', mealTypes: ['main'] },
    // Breakfast demo meals
    { name: 'Haferflocken mit Beeren', category: 'veg', mealTypes: ['breakfast'] },
    { name: 'Rührei mit Schnittlauch & Brot', category: 'veg', mealTypes: ['breakfast'] },
    { name: 'Pancakes mit Früchten', category: 'veg', mealTypes: ['breakfast'] },
    { name: 'Bacon & Eggs', category: 'meat', mealTypes: ['breakfast'] },
];

export const seedDatabase = async (userId: string) => {
    try {
        const promises = DEMO_MEALS.map(meal => 
            addMeal(meal.name, [meal.category], userId, '', false, '', [], undefined, undefined, null, meal.mealTypes || ['main'])
        );
        await Promise.all(promises);
        console.log('Demo meals added successfully');
        return true;
    } catch (error) {
        console.error('Error seeding database:', error);
        return false;
    }
};
