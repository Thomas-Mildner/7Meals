# 7Meals - Smart Meal Planner 🥗

7Meals is a intelligent, premium-designed meal planning application built with **React Native (Expo)** and **Firebase**. It helps users organize their weekly meals with a focus on smart suggestions, favorites, and history tracking.

## ✨ Features

- **Weekly Planning**: Generate a stored 7-day meal plan based on your preferences (Meat, Fish, Veggie).
- **Smart Algorithm**:
  - Prioritizes your ❤️ **Favorite** meals.
  - Avoids meals you've eaten recently (Automatic tracking).
  - **Duplicate Prevention**: Warns if a plan forces repeats due to lack of unique meals.
- **Multi-Category Support**: Assign meals to multiple categories (e.g., "Veggie" AND "Low-Carb") for better organization.
- **Consumption Tracking**:
  - One-tap "Mark as Eaten" 🟢.
  - Auto-logs history when new plans are generated.
  - Visual history in the Meal List ("Zuletzt gegessen: 12.01.2026").
- **Premium UI**: Dark-mode optimized with gradients, smooth animations, and intuitive gestures.

## 🛠 Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Navigation**: Expo Router (File-based routing)
- **Backend / DB**: Firebase Firestore
- **Authentication**: Firebase Auth (Anonymous, Email/Password)
- **Styling**: StyleSheet with Custom Design System (Gradients, Glassmorphism)
- **Icons**: Ionicons

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- generic Expo Go app on your phone OR Android/iOS Emulator

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Thomas-Mildner/7meals.git
    cd 7meals
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    - Create a `firebaseConfig.js` in `config/` with your Firestore credentials.

4.  **Run the app**
    ```bash
    npx expo start
    ```

## 📱 Project Structure

- `app/`: Expo Router screens (Tabs, Modals).
- `components/`: Reusable UI components (AddMealModal, etc.).
- `context/`: Global State (MealContext, AuthContext).
- `hooks/`: Business Logic hooks (useMealPlan).
- `services/`: Firebase API interactions.
- `constants/`: Design tokens (Colors, Layout).

## 💡 Future Feature Ideas

1. **Automatische Einkaufsliste 🛒**: Generate a shopping list automatically from the weekly plan based on meal ingredients.
2. **Smarter Rezept-Import per Link 🔗**: Automatically scrape recipe websites (e.g. Chefkoch) to fill in name, image, and ingredients.
3. **"Social Feed" mit Freunden 🌍**: A dedicated "Feed" tab to see what friends are cooking and easily copy their meals into your own plan.
4. **Statistiken & Insights 📊**: A improved dashboard showing interesting facts like vegetarian percentage, most cooked meals, or neglected recipes.
5. **Zeit- und Aufwands-Filter ⏱️**: Add duration and difficulty to meals so the planner can suggest quick meals on weekdays and elaborate ones on weekends.
6. **Zutaten-Vorratskammer (Pantry) 🥫**: Track pantry staples so they are automatically checked off the shopping list.
7. **Koch-Tagebuch (Bilder-Galerie) 📸**: Instead of a single image, store a history of images and dates every time you cook a meal.
8. **Saisonale Vorschläge & Tags ☀️❄️**: Custom tags (e.g. #Summer, #Grill) to let the algorithm prefer seasonal meals.
