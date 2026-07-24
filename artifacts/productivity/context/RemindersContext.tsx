import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
const STORAGE_KEY = '@orbit_reminders';
const NOTIF_ENABLED_KEY = '@orbit_notif_enabled';

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

async function scheduleOne(reminder: Reminder): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  try {
    return await Notifications.scheduleNotificationAsync({
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
  } catch (e) {
    console.error('Schedule notification error', e);
    return undefined;
  }
}

async function cancelOne(notificationId?: string) {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.error('Cancel notification error', e);
  }
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');

  // Keep a ref so AppState handler always sees current reminders
  const remindersRef = useRef(reminders);
  useEffect(() => { remindersRef.current = reminders; }, [reminders]);

  const notifEnabledRef = useRef(notificationsEnabled);
  useEffect(() => { notifEnabledRef.current = notificationsEnabled; }, [notificationsEnabled]);

  useEffect(() => {
    initialize();
  }, []);

  // Re-check permissions whenever the app comes back to the foreground
  // (user may have granted from device Settings)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', async nextState => {
      if (nextState !== 'active') return;
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted' && !notifEnabledRef.current) {
        setPermissionStatus('granted');
        setNotificationsEnabled(true);
        await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
        // Re-schedule all currently-enabled reminders
        const updated = await Promise.all(
          remindersRef.current.map(async r => {
            if (!r.enabled) return r;
            await cancelOne(r.notificationId);
            const notificationId = await scheduleOne(r);
            return { ...r, notificationId };
          }),
        );
        setReminders(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    });
    return () => sub.remove();
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
        // Re-schedule all currently-enabled reminders now that we have permission
        const current = remindersRef.current;
        if (current.length > 0) {
          const updated = await Promise.all(
            current.map(async r => {
              if (!r.enabled) return r;
              await cancelOne(r.notificationId);
              const notificationId = await scheduleOne(r);
              return { ...r, notificationId };
            }),
          );
          setReminders(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      } else {
        setPermissionStatus(status === 'denied' ? 'denied' : 'undetermined');
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

  const addReminder = useCallback(async (reminderData: Omit<Reminder, 'id' | 'notificationId'>) => {
    const reminder: Reminder = { ...reminderData, id: generateId() };
    // Always check live permission status, not just cached state
    if (reminder.enabled) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        reminder.notificationId = await scheduleOne(reminder);
      }
    }
    await saveReminders([...remindersRef.current, reminder]);
  }, []);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    const updated = remindersRef.current.map(r => r.id === id ? { ...r, ...updates } : r);
    await saveReminders(updated);
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    const r = remindersRef.current.find(rem => rem.id === id);
    if (r?.notificationId) await cancelOne(r.notificationId);
    await saveReminders(remindersRef.current.filter(rem => rem.id !== id));
  }, []);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = remindersRef.current.find(r => r.id === id);
    if (!reminder) return;

    // Always read live permission status so we don't miss a just-granted permission
    const { status } = Platform.OS !== 'web'
      ? await Notifications.getPermissionsAsync()
      : { status: 'denied' as const };
    const hasPermission = status === 'granted';

    let notificationId = reminder.notificationId;
    if (!reminder.enabled && hasPermission) {
      notificationId = await scheduleOne(reminder);
    } else if (reminder.enabled && notificationId) {
      await cancelOne(notificationId);
      notificationId = undefined;
    }

    const updated = remindersRef.current.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled, notificationId } : r,
    );
    await saveReminders(updated);
  }, []);

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
