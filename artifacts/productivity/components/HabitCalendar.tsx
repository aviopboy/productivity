import React, { useMemo, useRef, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_LABELS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOW_LABELS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── types ───────────────────────────────────────────────────────────────────

interface Props {
  habits: Habit[];
  onToggleDate: (habitId: string, dateStr: string) => void;
}

// ─── Day Detail Modal ────────────────────────────────────────────────────────

function DayModal({
  dateStr,
  habits,
  onToggle,
  onClose,
}: {
  dateStr: string | null;
  habits: Habit[];
  onToggle: (habitId: string, dateStr: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={!!dateStr}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {dateStr ? formatDisplay(dateStr) : ''}
            </Text>
            {dateStr && (
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                {habits.filter(h => h.completedDates.includes(dateStr)).length}/{habits.length} habits done
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.habitList} showsVerticalScrollIndicator={false}>
          {habits.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No habits yet</Text>
            </View>
          ) : habits.map(habit => {
            const done = dateStr ? habit.completedDates.includes(dateStr) : false;
            return (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitRow, { backgroundColor: colors.card, borderColor: done ? habit.color : colors.border }]}
                onPress={() => {
                  if (dateStr) {
                    onToggle(habit.id, dateStr);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
                  <Ionicons name={habit.icon as any} size={22} color={habit.color} />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, { color: colors.foreground }]}>{habit.name}</Text>
                  {!!habit.description && (
                    <Text style={[styles.habitDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {habit.description}
                    </Text>
                  )}
                </View>
                <View style={[styles.checkCircle, {
                  borderColor: done ? habit.color : colors.border,
                  backgroundColor: done ? habit.color : 'transparent',
                }]}>
                  {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  year, month, habits, weekStartsOn, onSelectDate,
}: {
  year: number; month: number; habits: Habit[]; weekStartsOn: 0 | 1;
  onSelectDate: (d: string) => void;
}) {
  const colors = useColors();
  const today = todayStr();
  const dowLabels = weekStartsOn === 1 ? DOW_LABELS_MON : DOW_LABELS_SUN;

  // Build day strings for the month
  const days = useMemo(() => {
    const arr: string[] = [];
    const count = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= count; d++) arr.push(ymd(year, month, d));
    return arr;
  }, [year, month]);

  // Offset: how many blank cells before the 1st
  const startOffset = useMemo(() => {
    const dow = new Date(year, month, 1).getDay(); // 0=Sun
    return (dow - weekStartsOn + 7) % 7;
  }, [year, month, weekStartsOn]);

  const rows = Math.ceil((startOffset + days.length) / 7);

  return (
    <View>
      {/* Day-of-week headers */}
      <View style={styles.dowRow}>
        {dowLabels.map(d => (
          <Text key={d} style={[styles.dowLabel, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>
      {/* Grid */}
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: 7 }).map((_, col) => {
            const idx = row * 7 + col - startOffset;
            if (idx < 0 || idx >= days.length) return <View key={col} style={styles.dayCell} />;
            const dateStr = days[idx];
            const completed = habits.filter(h => h.completedDates.includes(dateStr));
            const isToday = dateStr === today;
            const isFuture = dateStr > today;
            const rate = habits.length > 0 ? completed.length / habits.length : 0;
            return (
              <TouchableOpacity
                key={col}
                style={[styles.dayCell, isToday && [styles.todayCell, { borderColor: colors.primary }]]}
                onPress={() => { onSelectDate(dateStr); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                {rate === 1 && habits.length > 0 && (
                  <View style={[StyleSheet.absoluteFill, styles.fullFill, { backgroundColor: colors.primary + '22' }]} />
                )}
                <Text style={[
                  styles.dayNum,
                  { color: isFuture ? colors.mutedForeground : isToday ? colors.primary : colors.foreground },
                  isToday && styles.todayNum,
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

// ─── Year Heatmap View ───────────────────────────────────────────────────────

function YearView({
  year, habits, weekStartsOn, onSelectDate,
}: {
  year: number; habits: Habit[]; weekStartsOn: 0 | 1; onSelectDate: (d: string) => void;
}) {
  const colors = useColors();
  const today = todayStr();

  // Build a map of dateStr → completion rate
  const rateMap = useMemo(() => {
    const map: Record<string, number> = {};
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeap ? 366 : 365;
    for (let d = 0; d < totalDays; d++) {
      const date = new Date(year, 0, 1 + d);
      const str = date.toISOString().split('T')[0];
      if (habits.length === 0) { map[str] = 0; continue; }
      const done = habits.filter(h => h.completedDates.includes(str)).length;
      map[str] = done / habits.length;
    }
    return map;
  }, [year, habits]);

  // Build week columns: each column = 7 days starting from weekStartsOn
  // Jan 1 of the year
  const jan1Dow = new Date(year, 0, 1).getDay();
  // How many blank cells before Jan 1 in the first week column
  const leadingBlanks = (jan1Dow - weekStartsOn + 7) % 7;

  // Total cells = leadingBlanks + daysInYear, padded to full weeks
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;
  const totalCells = leadingBlanks + daysInYear;
  const totalWeeks = Math.ceil(totalCells / 7);

  // Build cell data: array of { dateStr | null }
  const cells = useMemo(() => {
    const arr: (string | null)[] = Array(leadingBlanks).fill(null);
    for (let d = 0; d < daysInYear; d++) {
      const date = new Date(year, 0, 1 + d);
      arr.push(date.toISOString().split('T')[0]);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, leadingBlanks, daysInYear]);

  // Month label positions: for each month, find the week column of the 1st
  const monthLabels = useMemo(() => {
    const labels: { month: number; col: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const date = new Date(year, m, 1);
      const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
      const col = Math.floor((dayOfYear - 1 + leadingBlanks) / 7);
      labels.push({ month: m, col });
    }
    return labels;
  }, [year, leadingBlanks]);

  const CELL = 13;
  const GAP = 2;
  const STRIDE = CELL + GAP;
  const DOW_W = 20;

  function cellColor(dateStr: string | null): string {
    if (!dateStr) return 'transparent';
    if (dateStr > today) return colors.border;
    const r = rateMap[dateStr] ?? 0;
    if (r === 0) return colors.muted;
    if (r < 0.5) return colors.primary + '55';
    if (r < 1) return colors.primary + 'AA';
    return colors.primary;
  }

  const dowLabels = weekStartsOn === 1 ? DOW_LABELS_MON : DOW_LABELS_SUN;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
      <View style={{ paddingBottom: 8 }}>
        {/* Month labels row */}
        <View style={[styles.monthLabelRow, { marginLeft: DOW_W + 4 }]}>
          {monthLabels.map(({ month, col }) => (
            <View key={month} style={[styles.monthLabelWrap, { left: col * STRIDE }]}>
              <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>
                {MONTH_SHORT[month]}
              </Text>
            </View>
          ))}
        </View>
        {/* Grid: 7 rows (one per day-of-week) */}
        <View style={styles.heatmapGrid}>
          {/* Day-of-week labels */}
          <View style={{ width: DOW_W, marginRight: 4 }}>
            {dowLabels.map((d, i) => (
              <View key={i} style={{ height: CELL, marginBottom: GAP, justifyContent: 'center' }}>
                {i % 2 === 0 && (
                  <Text style={[styles.heatDowLabel, { color: colors.mutedForeground }]}>{d}</Text>
                )}
              </View>
            ))}
          </View>
          {/* Week columns */}
          <View style={{ flexDirection: 'row', gap: GAP }}>
            {Array.from({ length: totalWeeks }).map((_, weekIdx) => (
              <View key={weekIdx} style={{ gap: GAP }}>
                {Array.from({ length: 7 }).map((_, dowIdx) => {
                  const cellIdx = weekIdx * 7 + dowIdx;
                  const dateStr = cells[cellIdx] ?? null;
                  const isToday = dateStr === today;
                  return (
                    <TouchableOpacity
                      key={dowIdx}
                      style={[
                        styles.heatCell,
                        { width: CELL, height: CELL, backgroundColor: cellColor(dateStr) },
                        isToday && { borderWidth: 1.5, borderColor: colors.primary },
                      ]}
                      onPress={() => {
                        if (dateStr) { onSelectDate(dateStr); Haptics.selectionAsync(); }
                      }}
                      disabled={!dateStr}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function HabitCalendar({ habits, onToggleDate }: Props) {
  const colors = useColors();
  const { settings } = useSettings();
  const { weekStartsOn } = settings;
  const today = todayStr();
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth();

  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [year, setYear] = useState(nowYear);
  const [month, setMonth] = useState(nowMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevPeriod = () => {
    if (viewMode === 'month') {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else setYear(y => y - 1);
  };
  const nextPeriod = () => {
    if (viewMode === 'month') {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    } else setYear(y => y + 1);
  };
  const goToToday = () => { setYear(nowYear); setMonth(nowMonth); };

  const navTitle = viewMode === 'month'
    ? `${MONTH_NAMES[month]} ${year}`
    : `${year}`;

  return (
    <View style={[styles.calendarWrap, { backgroundColor: colors.card }]}>
      {/* Top bar: view toggle + nav */}
      <View style={styles.topBar}>
        {/* Month / Year toggle */}
        <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
          {(['month', 'year'] as const).map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, viewMode === v && { backgroundColor: colors.primary }]}
              onPress={() => setViewMode(v)}
            >
              <Text style={[styles.toggleText, { color: viewMode === v ? '#fff' : colors.mutedForeground }]}>
                {v === 'month' ? 'Month' : 'Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevPeriod} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-back" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday}>
            <Text style={[styles.navTitle, { color: colors.foreground }]}>{navTitle}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextPeriod} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'month' ? (
        <MonthView
          year={year}
          month={month}
          habits={habits}
          weekStartsOn={weekStartsOn}
          onSelectDate={setSelectedDate}
        />
      ) : (
        <YearView
          year={year}
          habits={habits}
          weekStartsOn={weekStartsOn}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Footer hint */}
      <Text style={[styles.hint, { color: colors.mutedForeground, borderTopColor: colors.border }]}>
        Tap any day to view & edit completions
      </Text>

      <DayModal
        dateStr={selectedDate}
        habits={habits}
        onToggle={(id, date) => { onToggleDate(id, date); }}
        onClose={() => setSelectedDate(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  calendarWrap: {
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', minWidth: 120, textAlign: 'center' },
  // Month grid
  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  gridRow: { flexDirection: 'row', marginBottom: 2 },
  dayCell: {
    flex: 1, height: 44,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 4, borderRadius: 10, overflow: 'hidden', position: 'relative',
  },
  fullFill: { borderRadius: 10 },
  todayCell: { borderWidth: 1.5, borderRadius: 10 },
  dayNum: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  todayNum: { fontFamily: 'Inter_700Bold' },
  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginTop: 3, paddingHorizontal: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  hint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // Year heatmap
  yearScroll: { marginHorizontal: -4 },
  monthLabelRow: { flexDirection: 'row', position: 'relative', height: 16, marginBottom: 4 },
  monthLabelWrap: { position: 'absolute' },
  monthLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  heatmapGrid: { flexDirection: 'row', paddingHorizontal: 4 },
  heatDowLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  heatCell: { borderRadius: 3 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  heatLegendText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  // Modal
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  habitList: { padding: 16, gap: 10 },
  habitRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 12 },
  habitIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  habitDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
