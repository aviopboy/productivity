import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Habit } from '@/context/HabitsContext';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  habits: Habit[];
  onToggleDate: (habitId: string, dateStr: string) => void;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function HabitCalendar({ habits, onToggleDate }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const today = todayStr();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build the grid: blank cells + day strings for the month
  const { days, startOffset } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return { days: arr, startOffset: firstDow };
  }, [currentMonth]);

  const goToPrev = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNext = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCurrentMonth(d);
  };

  const getCompleted = (dateStr: string) => habits.filter(h => h.completedDates.includes(dateStr));

  // Build week rows for the grid
  const totalCells = startOffset + days.length;
  const rows = Math.ceil(totalCells / 7);

  return (
    <View style={[styles.calendarWrap, { backgroundColor: colors.card }]}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrev} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="chevron-back" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNext} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.dowRow}>
        {DAYS_SHORT.map(d => (
          <Text key={d} style={[styles.dowLabel, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      {/* Grid rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: 7 }).map((_, col) => {
            const cellIndex = row * 7 + col;
            const dayIndex = cellIndex - startOffset;
            if (dayIndex < 0 || dayIndex >= days.length) {
              return <View key={col} style={styles.dayCell} />;
            }
            const dateStr = days[dayIndex];
            const completed = getCompleted(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;
            const rate = habits.length > 0 ? completed.length / habits.length : 0;
            const dayNum = dayIndex + 1;

            return (
              <TouchableOpacity
                key={col}
                style={[
                  styles.dayCell,
                  isToday && [styles.todayCell, { borderColor: colors.primary }],
                ]}
                onPress={() => {
                  setSelectedDate(dateStr);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.7}
              >
                {/* Background fill for full completion */}
                {rate === 1 && habits.length > 0 && (
                  <View style={[StyleSheet.absoluteFill, styles.fullFill, { backgroundColor: colors.primary + '22' }]} />
                )}
                <Text style={[
                  styles.dayNum,
                  { color: isFuture ? colors.mutedForeground : isToday ? colors.primary : colors.foreground },
                  isToday && styles.todayNum,
                ]}>
                  {dayNum}
                </Text>
                {/* Completion dots */}
                <View style={styles.dotsRow}>
                  {completed.slice(0, 4).map(h => (
                    <View key={h.id} style={[styles.dot, { backgroundColor: h.color }]} />
                  ))}
                  {completed.length > 4 && (
                    <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { borderColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Today</Text>
        </View>
        <Text style={[styles.legendHint, { color: colors.mutedForeground }]}>
          Tap a day to edit
        </Text>
      </View>

      {/* Day detail / edit modal */}
      <Modal
        visible={!!selectedDate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {selectedDate ? formatDisplayDate(selectedDate) : ''}
              </Text>
              {selectedDate && (
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  {habits.filter(h => h.completedDates.includes(selectedDate)).length}/{habits.length} habits done
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedDate(null)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.habitList} showsVerticalScrollIndicator={false}>
            {habits.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No habits yet</Text>
              </View>
            ) : (
              habits.map(habit => {
                const done = selectedDate ? habit.completedDates.includes(selectedDate) : false;
                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: done ? habit.color : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (selectedDate) {
                        onToggleDate(habit.id, selectedDate);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    {/* Icon */}
                    <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
                      <Ionicons name={habit.icon as any} size={22} color={habit.color} />
                    </View>

                    {/* Name + description */}
                    <View style={styles.habitInfo}>
                      <Text style={[styles.habitName, { color: colors.foreground }]}>{habit.name}</Text>
                      {!!habit.description && (
                        <Text style={[styles.habitDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {habit.description}
                        </Text>
                      )}
                    </View>

                    {/* Check button */}
                    <View style={[
                      styles.checkCircle,
                      {
                        borderColor: done ? habit.color : colors.border,
                        backgroundColor: done ? habit.color : 'transparent',
                      },
                    ]}>
                      {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  calendarWrap: {
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  fullFill: {
    borderRadius: 10,
  },
  todayCell: {
    borderWidth: 1.5,
    borderRadius: 10,
  },
  dayNum: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  todayNum: {
    fontFamily: 'Inter_700Bold',
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginTop: 3,
    paddingHorizontal: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  legendHint: {
    marginLeft: 'auto' as any,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  // Modal
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  modalSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  habitList: {
    padding: 16,
    gap: 10,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  habitDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
});
