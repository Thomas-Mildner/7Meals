import { User as FirebaseUser } from 'firebase/auth';

export type MealType = 'breakfast' | 'main';
export type DaySlot = 'breakfast' | 'lunch' | 'dinner';

export interface Meal {
  id: string;
  name: string;
  categories: string[];
  category?: string; // For backwards compatibility
  mealTypes?: MealType[]; // 'breakfast', 'main', or both
  userId: string;
  ownerEmail: string;
  isShared: boolean;
  description: string;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastEaten?: string;
  imageUrl?: string | null;
  ingredients?: string[];
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export type PlanMeal = Meal & { isEaten?: boolean };

export interface DayPlan {
  date?: string;
  dayName?: string;
  breakfast: PlanMeal;
  lunch: PlanMeal;
  dinner: PlanMeal;
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
  addMeal: (name: string, categories: string[], description?: string, isShared?: boolean, ingredients?: string[], duration?: number, difficulty?: 'easy' | 'medium' | 'hard', imageUrl?: string | null, mealTypes?: MealType[]) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  markAsEaten: (id: string) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  toggleShared: (id: string, isShared: boolean) => Promise<void>;
  editMeal: (id: string, data: Partial<Meal>) => Promise<void>;
  importFriendMeal: (meal: Meal) => Promise<void>;
  searchFriendMeals: (email: string) => Promise<Meal[]>;
}
