import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface GoalMilestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  color: string;
  milestones: GoalMilestone[];
  completed: boolean;
  createdAt: string;
}

interface GoalsContextType {
  goals: Goal[];
  loading: boolean;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  getProgress: (goal: Goal) => number;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);
const STORAGE_KEY = '@orbit_goals';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setGoals(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load goals', e);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async (updated: Goal[]) => {
    setGoals(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal: Goal = {
      ...goalData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await saveGoals([goal, ...goals]);
  }, [goals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    await saveGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  }, [goals]);

  const deleteGoal = useCallback(async (id: string) => {
    await saveGoals(goals.filter(g => g.id !== id));
  }, [goals]);

  const toggleMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      const milestones = g.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const allDone = milestones.length > 0 && milestones.every(m => m.completed);
      return { ...g, milestones, completed: allDone };
    });
    await saveGoals(updated);
  }, [goals]);

  const getProgress = useCallback((goal: Goal): number => {
    if (goal.milestones.length === 0) return goal.completed ? 100 : 0;
    return Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100);
  }, []);

  return (
    <GoalsContext.Provider value={{ goals, loading, addGoal, updateGoal, deleteGoal, toggleMilestone, getProgress }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider');
  return ctx;
}
