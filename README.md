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

## 📸 Screenshots

| Weekly Plan | Smart Collection | Quick Add |
|:---:|:---:|:---:|
| ![Weekly Plan](/Users/thomasmildner/.gemini/antigravity/brain/8736d32d-61db-492c-888a-d668a4474dda/weekly_plan_screen_1768517128876.png) | ![Meal List](/Users/thomasmildner/.gemini/antigravity/brain/8736d32d-61db-492c-888a-d668a4474dda/meal_list_screen_1768517145423.png) | ![Add Modal](/Users/thomasmildner/.gemini/antigravity/brain/8736d32d-61db-492c-888a-d668a4474dda/add_meal_modal_1768517160533.png) |
| *Track daily progress* | *Organized by category* | *Multi-select categories* |

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
    git clone https://github.com/yourusername/7meals.git
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
