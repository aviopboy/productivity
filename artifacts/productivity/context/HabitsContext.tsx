import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_HABITS } from '@/constants/defaultData';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: 'health' | 'mind' | 'work' | 'social' | 'custom';
  icon: string;
  color: string;
  streak: number;
  longestStreak: number;
  completedDates: string[];
  createdAt: string;
  isDefault: boolean;
}

interface HabitsContextType {
  habits: Habit[];
  loading: boolean;
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completedDates' | 'createdAt'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string) => Promise<void>;
  isCompletedToday: (habit: Habit) => boolean;
  getTodayCompletionRate: () => number;
  getTodayCompletedCount: () => number;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

const STORAGE_KEY = '@momentum_habits';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  for (const dateStr of sorted) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === cursor.getTime()) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (d.getTime() < cursor.getTime()) {
      break;
    }
  }
  return streak;
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHabits(JSON.parse(stored));
      } else {
        const defaults = DEFAULT_HABITS.map(h => ({
          ...h,
          id: generateId(),
          streak: 0,
          longestStreak: 0,
          completedDates: [],
          createdAt: new Date().toISOString(),
        }));
        setHabits(defaults);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error('Failed to load habits', e);
    } finally {
      setLoading(false);
    }
  };

  const saveHabits = async (updated: Habit[]) => {
    setHabits(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completedDates' | 'createdAt'>) => {
    const habit: Habit = {
      ...habitData,
      id: generateId(),
      streak: 0,
      longestStreak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    await saveHabits([...habits, habit]);
  }, [habits]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    const updated = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    await saveHabits(updated);
  }, [habits]);

  const deleteHabit = useCallback(async (id: string) => {
    await saveHabits(habits.filter(h => h.id !== id));
  }, [habits]);

  const toggleHabitCompletion = useCallback(async (id: string) => {
    const today = getTodayStr();
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      let completedDates: string[];
      if (h.completedDates.includes(today)) {
        completedDates = h.completedDates.filter(d => d !== today);
      } else {
        completedDates = [...h.completedDates, today];
      }
      const streak = calculateStreak(completedDates);
      return {
        ...h,
        completedDates,
        streak,
        longestStreak: Math.max(h.longestStreak, streak),
      };
    });
    await saveHabits(updated);
  }, [habits]);

  const isCompletedToday = useCallback((habit: Habit) => {
    return habit.completedDates.includes(getTodayStr());
  }, []);

  const getTodayCompletionRate = useCallback(() => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => h.completedDates.includes(getTodayStr())).length;
    return completed / habits.length;
  }, [habits]);

  const getTodayCompletedCount = useCallback(() => {
    return habits.filter(h => h.completedDates.includes(getTodayStr())).length;
  }, [habits]);

  return (
    <HabitsContext.Provider value={{
      habits, loading, addHabit, updateHabit, deleteHabit,
      toggleHabitCompletion, isCompletedToday,
      getTodayCompletionRate, getTodayCompletedCount,
    }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used within HabitsProvider');
  return ctx;
}
