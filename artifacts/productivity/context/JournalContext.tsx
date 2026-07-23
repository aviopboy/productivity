import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  updatedAt: string;
}

interface JournalContextType {
  entries: JournalEntry[];
  loading: boolean;
  todayEntry: JournalEntry | null;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryByDate: (date: string) => JournalEntry | undefined;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);
const STORAGE_KEY = '@momentum_journal';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load journal', e);
    } finally {
      setLoading(false);
    }
  };

  const saveEntries = async (updated: JournalEntry[]) => {
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addEntry = useCallback(async (entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      ...entryData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await saveEntries([entry, ...entries]);
  }, [entries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<JournalEntry>) => {
    const updated = entries.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    await saveEntries(updated);
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    await saveEntries(entries.filter(e => e.id !== id));
  }, [entries]);

  const getEntryByDate = useCallback((date: string) => {
    return entries.find(e => e.date === date);
  }, [entries]);

  const todayEntry = entries.find(e => e.date === getTodayStr()) ?? null;

  return (
    <JournalContext.Provider value={{
      entries, loading, todayEntry,
      addEntry, updateEntry, deleteEntry, getEntryByDate,
    }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within JournalProvider');
  return ctx;
}
