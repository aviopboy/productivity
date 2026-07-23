import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_REMINDERS } from '@/constants/defaultData';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  hour: number;
  minute: number;
  days: number[];
  enabled: boolean;
  notificationId?: string;
  isDefault: boolean;
}

interface RemindersContextType {
  reminders: Reminder[];
  loading: boolean;
  notificationsEnabled: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  requestPermission: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'notificationId'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);
const STORAGE_KEY = '@momentum_reminders';
const NOTIF_ENABLED_KEY = '@momentum_notif_enabled';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#5B4FE9',
        });
      }

      const { status } = await Notifications.getPermissionsAsync();
      const storedEnabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);

      if (status === 'granted') {
        setPermissionStatus('granted');
        setNotificationsEnabled(storedEnabled !== 'false');
      } else if (status === 'denied') {
        setPermissionStatus('denied');
        setNotificationsEnabled(false);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      } else {
        setPermissionStatus('undetermined');
        // Auto-request on first launch
        await requestPermissionInternal();
      }
      await loadReminders();
    } catch (e) {
      console.error('RemindersContext init error', e);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissionInternal = async () => {
    try {
      if (Platform.OS === 'web') return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        setNotificationsEnabled(true);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
      } else {
        setPermissionStatus('denied');
        setNotificationsEnabled(false);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      }
    } catch (e) {
      console.error('requestPermission error', e);
    }
  };

  const requestPermission = useCallback(requestPermissionInternal, []);

  const loadReminders = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      setReminders(JSON.parse(stored));
    } else {
      const defaults: Reminder[] = DEFAULT_REMINDERS.map(r => ({
        ...r,
        id: generateId(),
        enabled: false,
        isDefault: r.isDefault,
      }));
      setReminders(defaults);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    }
  };

  const saveReminders = async (updated: Reminder[]) => {
    setReminders(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const scheduleNotification = async (reminder: Reminder): Promise<string | undefined> => {
    if (Platform.OS === 'web') return undefined;
    try {
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: reminder.minute,
        },
      });
      return notifId;
    } catch (e) {
      console.error('Schedule notification error', e);
      return undefined;
    }
  };

  const cancelNotification = async (notificationId?: string) => {
    if (!notificationId || Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.error('Cancel notification error', e);
    }
  };

  const addReminder = useCallback(async (reminderData: Omit<Reminder, 'id' | 'notificationId'>) => {
    const reminder: Reminder = { ...reminderData, id: generateId() };
    if (reminder.enabled && notificationsEnabled) {
      reminder.notificationId = await scheduleNotification(reminder);
    }
    await saveReminders([...reminders, reminder]);
  }, [reminders, notificationsEnabled]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    const updated = reminders.map(r => r.id === id ? { ...r, ...updates } : r);
    await saveReminders(updated);
  }, [reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    const r = reminders.find(rem => rem.id === id);
    if (r?.notificationId) await cancelNotification(r.notificationId);
    await saveReminders(reminders.filter(rem => rem.id !== id));
  }, [reminders]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    let notificationId = reminder.notificationId;
    if (!reminder.enabled && notificationsEnabled) {
      notificationId = await scheduleNotification(reminder);
    } else if (reminder.enabled && notificationId) {
      await cancelNotification(notificationId);
      notificationId = undefined;
    }
    const updated = reminders.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled, notificationId } : r
    );
    await saveReminders(updated);
  }, [reminders, notificationsEnabled]);

  return (
    <RemindersContext.Provider value={{
      reminders, loading, notificationsEnabled, permissionStatus,
      requestPermission, addReminder, updateReminder, deleteReminder, toggleReminder,
    }}>
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used within RemindersProvider');
  return ctx;
}
