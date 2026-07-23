import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHabits } from '@/context/HabitsContext';
import { useJournal } from '@/context/JournalContext';
import { useGoals } from '@/context/GoalsContext';
import { useReminders } from '@/context/RemindersContext';
import { ProgressRing } from '@/components/ProgressRing';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Pomodoro timer durations
const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, toggleHabitCompletion, isCompletedToday, getTodayCompletionRate, getTodayCompletedCount } = useHabits();
  const { todayEntry } = useJournal();
  const { goals } = useGoals();
  const { reminders, notificationsEnabled } = useReminders();

  // Pomodoro state
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(WORK_DURATION);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pomodoroActive) {
      timerRef.current = setInterval(() => {
        setPomodoroTime(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (!isBreak) {
              setPomodoroCount(c => c + 1);
              setIsBreak(true);
              setPomodoroActive(false);
              setPomodoroTime(BREAK_DURATION);
            } else {
              setIsBreak(false);
              setPomodoroActive(false);
              setPomodoroTime(WORK_DURATION);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pomodoroActive, isBreak]);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    setIsBreak(false);
    setPomodoroTime(WORK_DURATION);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const completionRate = getTodayCompletionRate();
  const completedCount = getTodayCompletedCount();
  const activeGoals = goals.filter(g => !g.completed).length;
  const enabledReminders = reminders.filter(r => r.enabled).length;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPadding + 16, paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.dateLabel, { color: colors.foreground }]}>{getTodayLabel()}</Text>
        </View>
        <View style={[styles.streakPill, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="flame" size={16} color={colors.warning} />
          <Text style={[styles.streakPillText, { color: colors.warning }]}>
            {Math.max(...habits.map(h => h.streak), 0)} day streak
          </Text>
        </View>
      </View>

      {/* Progress Hero Card */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroLeft}>
          <Text style={styles.heroTitle}>Today's Progress</Text>
          <Text style={styles.heroCompleted}>{completedCount}/{habits.length} habits done</Text>
          {completionRate === 1 && habits.length > 0 && (
            <View style={styles.perfectBadge}>
              <Ionicons name="trophy" size={12} color="#F59E0B" />
              <Text style={styles.perfectText}>Perfect day!</Text>
            </View>
          )}
        </View>
        <ProgressRing
          progress={completionRate}
          size={90}
          strokeWidth={8}
          color="#FFFFFF"
          backgroundColor="rgba(255,255,255,0.25)"
          label={`${Math.round(completionRate * 100)}%`}
          sublabel="complete"
        />
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard icon="trophy-outline" label="Active Goals" value={activeGoals.toString()} color={colors.success} colors={colors} />
        <StatCard icon="bell-outline" label="Reminders" value={enabledReminders.toString()} color={colors.remindersColor} colors={colors} />
        <StatCard icon="book-outline" label="Journal" value={todayEntry ? '1' : '0'} color={colors.journalColor} colors={colors} />
      </View>

      {/* Today's Habits */}
      <SectionHeader title="Today's Habits" colors={colors} />
      {habits.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Go to Habits tab to set up your habits</Text>
        </View>
      ) : (
        habits.slice(0, 5).map(habit => {
          const done = isCompletedToday(habit);
          return (
            <TouchableOpacity
              key={habit.id}
              style={[styles.miniHabit, { backgroundColor: colors.card, borderColor: done ? habit.color : colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleHabitCompletion(habit.id);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.miniHabitIcon, { backgroundColor: habit.color + '20' }]}>
                <Ionicons name={habit.icon as any} size={18} color={habit.color} />
              </View>
              <Text style={[styles.miniHabitName, { color: colors.foreground }]}>{habit.name}</Text>
              {habit.streak > 0 && (
                <View style={styles.miniStreak}>
                  <Ionicons name="flame" size={10} color="#F59E0B" />
                  <Text style={styles.miniStreakText}>{habit.streak}</Text>
                </View>
              )}
              <View style={[styles.miniCheck, { backgroundColor: done ? habit.color : 'transparent', borderColor: done ? habit.color : colors.border }]}>
                {done && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Pomodoro Timer */}
      <SectionHeader title="Focus Timer" colors={colors} />
      <View style={[styles.pomodoroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.pomodoroHeader}>
          <View style={[styles.pomodoroBadge, { backgroundColor: isBreak ? '#22C55E20' : colors.primary + '20' }]}>
            <Text style={[styles.pomodoroBadgeText, { color: isBreak ? '#22C55E' : colors.primary }]}>
              {isBreak ? 'Break' : 'Focus'}
            </Text>
          </View>
          <View style={styles.pomodoroSessions}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.sessionDot, { backgroundColor: i < pomodoroCount ? colors.primary : colors.muted }]} />
            ))}
          </View>
        </View>
        <Text style={[styles.timerText, { color: colors.foreground }]}>{formatTimer(pomodoroTime)}</Text>
        <View style={styles.pomodoroControls}>
          <TouchableOpacity
            style={[styles.pomodoroBtn, { backgroundColor: pomodoroActive ? colors.warning : colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPomodoroActive(a => !a);
            }}
          >
            <Ionicons name={pomodoroActive ? 'pause' : 'play'} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pomodoroResetBtn, { backgroundColor: colors.muted }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              resetPomodoro();
            }}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.pomodoroHint, { color: colors.mutedForeground }]}>
          {isBreak ? 'Take a short break, you earned it' : '25 min focus · 5 min break'}
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.foreground }]}>{title}</Text>
  );
}

function StatCard({ icon, label, value, color, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  dateLabel: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)' },
  heroCompleted: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  perfectBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  perfectText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#F59E0B' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  miniHabit: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 10,
  },
  miniHabitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniHabitName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  miniStreak: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  miniStreakText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#F59E0B' },
  miniCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  pomodoroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pomodoroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  pomodoroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pomodoroBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  pomodoroSessions: { flexDirection: 'row', gap: 6 },
  sessionDot: { width: 8, height: 8, borderRadius: 4 },
  timerText: { fontSize: 56, fontFamily: 'Inter_700Bold', letterSpacing: -2 },
  pomodoroControls: { flexDirection: 'row', gap: 12 },
  pomodoroBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pomodoroResetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  pomodoroHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
