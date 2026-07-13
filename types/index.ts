import { User as FirebaseUser } from 'firebase/auth';

export interface Meal {
  id: string;
  name: string;
  categories: string[];
  category?: string; // For backwards compatibility
  userId: string;
  ownerEmail: string;
  isShared: boolean;
  description: string;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastEaten?: string;
}

export interface MealPlanDay {
  date: string;
  mealId: string | null;
  isEaten?: boolean;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginAnonymously: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  registerWithEmail: (email: string, password: string) => Promise<any>;
  loginWithCredential: (credential: any) => Promise<any>;
  googleProvider: any;
  logout: () => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: any; // We can type this strictly later based on Colors.ts
  toggleTheme: () => void;
}

export interface MealContextType {
  meals: Meal[];
  loading: boolean;
  error: any;
  refreshMeals: () => Promise<void>;
  addMeal: (name: string, categories: string[], description?: string, isShared?: boolean) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  markAsEaten: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  toggleShared: (id: string, isShared: boolean) => Promise<void>;
  editMeal: (id: string, data: Partial<Meal>) => Promise<void>;
  importFriendMeal: (meal: Meal) => Promise<void>;
  searchFriendMeals: (email: string) => Promise<Meal[]>;
}
