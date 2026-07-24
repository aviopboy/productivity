import React, { useMemo, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/context/SettingsContext';
import { Habit } from '@/context/HabitsContext';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}
function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function formatDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW_SUN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DOW_MON = ['Mo','Tu','We','Th','Fr','Sa','Su'];

interface Props {
  habits: Habit[];
  onToggleDate: (habitId: string, dateStr: string) => void;
}

// ─── Inline Day Panel ────────────────────────────────────────────────────────

function InlineDayPanel({
  dateStr, habits, onToggle, onClose,
}: {
  dateStr: string; habits: Habit[];
  onToggle: (id: string, date: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const doneCount = habits.filter(h => h.completedDates.includes(dateStr)).length;

  return (
    <View style={[styles.panel, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {/* Panel header */}
      <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.panelDate, { color: colors.foreground }]}>{formatDisplay(dateStr)}</Text>
          <Text style={[styles.panelSub, { color: colors.mutedForeground }]}>
            {doneCount}/{habits.length} habits completed
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="close" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Habit rows with checkboxes */}
      {habits.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No habits yet</Text>
      ) : habits.map(habit => {
        const done = habit.completedDates.includes(dateStr);
        return (
          <TouchableOpacity
            key={habit.id}
            style={[styles.panelRow, { borderBottomColor: colors.border }]}
            onPress={() => { onToggle(habit.id, dateStr); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.7}
          >
            <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
              <Ionicons name={habit.icon as any} size={18} color={habit.color} />
            </View>
            <Text style={[styles.habitName, { color: colors.foreground }]} numberOfLines={1}>
              {habit.name}
            </Text>
            {/* Excel-style checkbox */}
            <View style={[
              styles.checkbox,
              {
                backgroundColor: done ? habit.color : 'transparent',
                borderColor: done ? habit.color : colors.border,
              },
            ]}>
              {done && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  year, month, habits, weekStartsOn, selectedDate, onSelectDate,
}: {
  year: number; month: number; habits: Habit[];
  weekStartsOn: 0 | 1; selectedDate: string | null;
  onSelectDate: (d: string) => void;
}) {
  const colors = useColors();
  const today = todayStr();
  const dowLabels = weekStartsOn === 1 ? DOW_MON : DOW_SUN;

  const days = useMemo(() => {
    const arr: string[] = [];
    const count = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= count; d++) arr.push(ymd(year, month, d));
    return arr;
  }, [year, month]);

  const startOffset = useMemo(() => {
    const dow = new Date(year, month, 1).getDay();
    return (dow - weekStartsOn + 7) % 7;
  }, [year, month, weekStartsOn]);

  const rows = Math.ceil((startOffset + days.length) / 7);

  return (
    <View>
      <View style={styles.dowRow}>
        {dowLabels.map(d => (
          <Text key={d} style={[styles.dowLabel, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: 7 }).map((_, col) => {
            const idx = row * 7 + col - startOffset;
            if (idx < 0 || idx >= days.length) return <View key={col} style={styles.dayCell} />;
            const dateStr = days[idx];
            const completed = habits.filter(h => h.completedDates.includes(dateStr));
            const isToday = dateStr === today;
            const isFuture = dateStr > today;
            const isSelected = dateStr === selectedDate;
            const rate = habits.length > 0 ? completed.length / habits.length : 0;
            return (
              <TouchableOpacity
                key={col}
                style={[
                  styles.dayCell,
                  isToday && [styles.todayCell, { borderColor: colors.primary }],
                  isSelected && { backgroundColor: colors.primary + '28', borderRadius: 10 },
                ]}
                onPress={() => { onSelectDate(dateStr); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                {rate === 1 && habits.length > 0 && !isSelected && (
                  <View style={[StyleSheet.absoluteFill, styles.fullFill, { backgroundColor: colors.primary + '18' }]} />
                )}
                <Text style={[
                  styles.dayNum,
                  { color: isFuture ? colors.mutedForeground : isToday ? colors.primary : colors.foreground },
                  (isToday || isSelected) && styles.todayNum,
                  isSelected && { color: colors.primary },
                ]}>
                  {idx + 1}
                </Text>
                <View style={styles.dotsRow}>
                  {completed.slice(0, 4).map(h => (
                    <View key={h.id} style={[styles.dot, { backgroundColor: h.color }]} />
                  ))}
                  {completed.length > 4 && <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Year Heatmap ────────────────────────────────────────────────────────────

function YearView({
  year, habits, weekStartsOn, onSelectDate,
}: {
  year: number; habits: Habit[]; weekStartsOn: 0 | 1;
  onSelectDate: (d: string) => void;
}) {
  const colors = useColors();
  const today = todayStr();

  const { cells, totalWeeks, leadingBlanks, monthLabels, rateMap } = useMemo(() => {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;
    const jan1Dow = new Date(year, 0, 1).getDay();
    const lead = (jan1Dow - weekStartsOn + 7) % 7;

    const rm: Record<string, number> = {};
    const arr: (string | null)[] = Array(lead).fill(null);
    for (let d = 0; d < daysInYear; d++) {
      const date = new Date(year, 0, 1 + d);
      const str = date.toISOString().split('T')[0];
      rm[str] = habits.length === 0 ? 0 : habits.filter(h => h.completedDates.includes(str)).length / habits.length;
      arr.push(str);
    }
    while (arr.length % 7 !== 0) arr.push(null);

    const labels: { month: number; col: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const date = new Date(year, m, 1);
      const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
      labels.push({ month: m, col: Math.floor((dayOfYear - 1 + lead) / 7) });
    }

    return { cells: arr, totalWeeks: arr.length / 7, leadingBlanks: lead, monthLabels: labels, rateMap: rm };
  }, [year, habits, weekStartsOn]);

  const CELL = 13, GAP = 2, STRIDE = CELL + GAP, DOW_W = 20;
  const dowLabels = weekStartsOn === 1 ? DOW_MON : DOW_SUN;

  function cellColor(d: string | null) {
    if (!d) return 'transparent';
    if (d > today) return colors.border;
    const r = rateMap[d] ?? 0;
    if (r === 0) return colors.muted;
    if (r < 0.5) return colors.primary + '55';
    if (r < 1) return colors.primary + 'AA';
    return colors.primary;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ paddingBottom: 4 }}>
        <View style={[styles.monthLabelRow, { marginLeft: DOW_W + 4 }]}>
          {monthLabels.map(({ month, col }) => (
            <View key={month} style={[styles.monthLabelWrap, { left: col * STRIDE }]}>
              <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>{MONTH_SHORT[month]}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: DOW_W, marginRight: 4 }}>
            {dowLabels.map((d, i) => (
              <View key={i} style={{ height: CELL, marginBottom: GAP, justifyContent: 'center' }}>
                {i % 2 === 0 && <Text style={[styles.heatDowLabel, { color: colors.mutedForeground }]}>{d}</Text>}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {Array.from({ length: totalWeeks }).map((_, wi) => (
              <View key={wi} style={{ gap: GAP }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const dateStr = cells[wi * 7 + di] ?? null;
                  return (
                    <TouchableOpacity
                      key={di}
                      style={[styles.heatCell, { width: CELL, height: CELL, backgroundColor: cellColor(dateStr) },
                        dateStr === today && { borderWidth: 1.5, borderColor: colors.primary }]}
                      onPress={() => { if (dateStr) { onSelectDate(dateStr); Haptics.selectionAsync(); } }}
                      disabled={!dateStr}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.heatLegend, { marginLeft: DOW_W + 4 }]}>
          <Text style={[styles.heatLegendText, { color: colors.mutedForeground }]}>Less</Text>
          {[colors.muted, colors.primary + '55', colors.primary + 'AA', colors.primary].map((c, i) => (
            <View key={i} style={[styles.heatCell, { width: CELL, height: CELL, backgroundColor: c }]} />
          ))}
          <Text style={[styles.heatLegendText, { color: colors.mutedForeground }]}>More</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HabitCalendar({ habits, onToggleDate }: Props) {
  const colors = useColors();
  const { settings } = useSettings();
  const { weekStartsOn } = settings;
  const today = todayStr();
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth();

  const [view, setView] = useState<'month' | 'year'>('month');
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleSelectDate = (d: string) => {
    setSelectedDate(prev => (prev === d ? null : d));
    // If in year view, jump to that month
    if (view === 'year') {
      const [y, m] = d.split('-').map(Number);
      setYear(y); setMonth(m - 1); setView('month');
    }
  };

  const prevPeriod = () => {
    if (view === 'month') { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
    else setYear(y => y - 1);
  };
  const nextPeriod = () => {
    if (view === 'month') { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }
    else setYear(y => y + 1);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
          {(['month', 'year'] as const).map(v => (
            <TouchableOpacity key={v}
              style={[styles.toggleBtn, view === v && { backgroundColor: colors.primary }]}
              onPress={() => setView(v)}>
              <Text style={[styles.toggleText, { color: view === v ? '#fff' : colors.mutedForeground }]}>
                {v === 'month' ? 'Month' : 'Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevPeriod} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-back" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setYear(nowYear); setMonth(nowMonth); }}>
            <Text style={[styles.navTitle, { color: colors.foreground }]}>
              {view === 'month' ? `${MONTH_NAMES[month]} ${year}` : `${year}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextPeriod} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {view === 'month' ? (
        <MonthView
          year={year} month={month} habits={habits}
          weekStartsOn={weekStartsOn}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      ) : (
        <YearView year={year} habits={habits} weekStartsOn={weekStartsOn} onSelectDate={handleSelectDate} />
      )}

      <Text style={[styles.hint, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
        Tap a day to view & check off habits
      </Text>

      {/* Inline day panel — no modal */}
      {selectedDate && view === 'month' && (
        <InlineDayPanel
          dateStr={selectedDate}
          habits={habits}
          onToggle={onToggleDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, borderRadius: 20,
    paddingVertical: 16, paddingHorizontal: 12, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
  viewToggle: { flexDirection: 'row', borderRadius: 10, padding: 2, gap: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', minWidth: 130, textAlign: 'center' },
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  gridRow: { flexDirection: 'row', marginBottom: 2 },
  dayCell: {
    flex: 1, height: 46, alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 4, borderRadius: 10, overflow: 'hidden', position: 'relative',
  },
  fullFill: { borderRadius: 10 },
  todayCell: { borderWidth: 1.5, borderRadius: 10 },
  dayNum: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  todayNum: { fontFamily: 'Inter_700Bold' },
  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginTop: 3, paddingHorizontal: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  // Inline panel
  panel: {
    marginTop: 12, borderRadius: 14, borderWidth: 1,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  panelDate: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  panelSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  panelRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  habitIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  habitName: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', padding: 16, textAlign: 'center' },
  // Year heatmap
  monthLabelRow: { flexDirection: 'row', position: 'relative', height: 16, marginBottom: 4 },
  monthLabelWrap: { position: 'absolute' },
  monthLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  heatDowLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  heatCell: { borderRadius: 3 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  heatLegendText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
