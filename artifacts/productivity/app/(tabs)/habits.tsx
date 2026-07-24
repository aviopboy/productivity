import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ScrollView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/context/SettingsContext';
import { useHabits, Habit } from '@/context/HabitsContext';
import { HabitCard } from '@/components/HabitCard';
import { HabitCalendar } from '@/components/HabitCalendar';
import { EmptyState } from '@/components/EmptyState';
import { HABIT_ICONS, HABIT_COLORS, HABIT_CATEGORIES } from '@/constants/defaultData';

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface HabitForm {
  name: string;
  description: string;
  category: 'health' | 'mind' | 'work' | 'social' | 'custom';
  icon: string;
  color: string;
}

const DEFAULT_FORM: HabitForm = {
  name: '',
  description: '',
  category: 'health',
  icon: 'checkmark-circle-outline',
  color: '#5B4FE9',
};

/** Last N days as YYYY-MM-DD, most recent last */
function lastNDays(n: number): string[] {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().split('T')[0]);
  }
  return arr;
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
}

// ─── Excel-style Grid View ────────────────────────────────────────────────────

function GridView({
  habits, onToggleDate, onEdit, onDelete,
}: {
  habits: Habit[];
  onToggleDate: (id: string, dateStr: string) => void;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const days = lastNDays(7);
  const today = new Date().toISOString().split('T')[0];
  const COL_W = 44;
  const ROW_H = 52;

  if (habits.length === 0) {
    return (
      <View style={styles.gridEmpty}>
        <Ionicons name="grid-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.gridEmptyText, { color: colors.mutedForeground }]}>No habits yet</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={[styles.gridHeaderRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={[styles.gridHabitCol, { borderRightColor: colors.border }]}>
              <Text style={[styles.gridHeaderText, { color: colors.mutedForeground }]}>HABIT</Text>
            </View>
            {days.map(d => (
              <View key={d} style={[styles.gridDayCol, { width: COL_W, borderRightColor: colors.border },
                d === today && { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.gridDayLabel, { color: d === today ? colors.primary : colors.mutedForeground }]}>
                  {dayLabel(d)}
                </Text>
                <Text style={[styles.gridDateLabel, { color: d === today ? colors.primary : colors.mutedForeground }]}>
                  {shortDate(d)}
                </Text>
              </View>
            ))}
            <View style={[styles.gridActionsCol, { borderLeftColor: colors.border }]} />
          </View>

          {/* Habit rows */}
          {habits.map((habit, i) => (
            <View
              key={habit.id}
              style={[
                styles.gridRow,
                { backgroundColor: i % 2 === 0 ? colors.card : colors.muted + '50', borderBottomColor: colors.border },
              ]}
            >
              {/* Habit name cell */}
              <View style={[styles.gridHabitCol, { borderRightColor: colors.border }]}>
                <View style={[styles.gridIcon, { backgroundColor: habit.color + '20' }]}>
                  <Ionicons name={habit.icon as any} size={14} color={habit.color} />
                </View>
                <Text style={[styles.gridHabitName, { color: colors.foreground }]} numberOfLines={2}>
                  {habit.name}
                </Text>
              </View>

              {/* Day checkbox cells */}
              {days.map(d => {
                const done = habit.completedDates.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.gridDayCol,
                      { width: COL_W, borderRightColor: colors.border, height: ROW_H },
                      d === today && { backgroundColor: colors.primary + '10' },
                    ]}
                    onPress={() => { onToggleDate(habit.id, d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    activeOpacity={0.6}
                  >
                    <View style={[
                      styles.gridCheckbox,
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

              {/* Edit/Delete actions */}
              <View style={[styles.gridActionsCol, { height: ROW_H, borderLeftColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.gridActionBtn, { backgroundColor: colors.muted }]}
                  onPress={() => onEdit(habit)}
                  hitSlop={6}
                >
                  <Ionicons name="pencil-outline" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.gridActionBtn, { backgroundColor: '#EF444418' }]}
                  onPress={() => Alert.alert(`Delete "${habit.name}"?`, 'This removes the habit and all history.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(habit.id) },
                  ])}
                  hitSlop={6}
                >
                  <Ionicons name="trash-outline" size={13} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const {
    habits, addHabit, updateHabit, deleteHabit,
    toggleHabitCompletion, toggleHabitCompletionForDate,
    isCompletedToday, getTodayCompletedCount,
  } = useHabits();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HabitForm>(DEFAULT_FORM);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>(settings.defaultHabitView as any || 'list');

  const openAdd = () => { setForm(DEFAULT_FORM); setEditingId(null); setModalVisible(true); };
  const openEdit = (habit: Habit) => {
    setForm({ name: habit.name, description: habit.description, category: habit.category, icon: habit.icon, color: habit.color });
    setEditingId(habit.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required', 'Please enter a habit name.'); return; }
    if (editingId) await updateHabit(editingId, form);
    else await addHabit({ ...form, isDefault: false });
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filtered = filter === 'all' ? habits : habits.filter(h => h.category === filter);
  const completedToday = getTodayCompletedCount();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const VIEW_MODES = [
    { key: 'list', icon: 'list-outline' },
    { key: 'grid', icon: 'grid-outline' },
    { key: 'calendar', icon: 'calendar-outline' },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Habits</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            {completedToday}/{habits.length} completed today
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
            {VIEW_MODES.map(({ key, icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.toggleBtn, viewMode === key && { backgroundColor: colors.primary }]}
                onPress={() => setViewMode(key)}
              >
                <Ionicons name={icon as any} size={17} color={viewMode === key ? '#fff' : colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Calendar view ── */}
      {viewMode === 'calendar' && (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }}>
          <HabitCalendar
            habits={habits}
            onToggleDate={toggleHabitCompletionForDate}
          />
        </ScrollView>
      )}

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        <GridView
          habits={habits}
          onToggleDate={toggleHabitCompletionForDate}
          onEdit={openEdit}
          onDelete={deleteHabit}
        />
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {[{ value: 'all', label: 'All' }, ...HABIT_CATEGORIES].map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.filterChip, { backgroundColor: filter === cat.value ? colors.primary : colors.muted }]}
                onPress={() => setFilter(cat.value)}
              >
                <Text style={[styles.filterChipText, { color: filter === cat.value ? '#fff' : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtered.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" title="No habits yet"
              description="Tap + to add your first habit and start building routines" />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={h => h.id}
              renderItem={({ item }) => (
                <HabitCard
                  habit={item}
                  completed={isCompletedToday(item)}
                  onToggle={() => toggleHabitCompletion(item.id)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => deleteHabit(item.id)}
                />
              )}
              contentContainerStyle={[styles.list,
                { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAwareScrollView style={[styles.modal, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editingId ? 'Edit Habit' : 'New Habit'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Habit Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Drink water" placeholderTextColor={colors.mutedForeground}
            value={form.name} onChangeText={t => setForm(f => ({ ...f, name: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Optional description" placeholderTextColor={colors.mutedForeground}
            value={form.description} onChangeText={t => setForm(f => ({ ...f, description: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll} contentContainerStyle={styles.optionContent}>
            {HABIT_CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.value}
                style={[styles.optionChip, { backgroundColor: form.category === cat.value ? colors.primary : colors.muted }]}
                onPress={() => setForm(f => ({ ...f, category: cat.value as any }))}>
                <Text style={[styles.optionChipText, { color: form.category === cat.value ? '#fff' : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
          <View style={styles.colorGrid}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity key={c}
                style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorDotSelected]}
                onPress={() => setForm(f => ({ ...f, color: c }))}>
                {form.color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map(ic => (
              <TouchableOpacity key={ic}
                style={[styles.iconOption, {
                  backgroundColor: form.icon === ic ? form.color + '30' : colors.muted,
                  borderColor: form.icon === ic ? form.color : 'transparent',
                }]}
                onPress={() => setForm(f => ({ ...f, icon: ic }))}>
                <Ionicons name={ic as any} size={22} color={form.icon === ic ? form.color : colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{editingId ? 'Save Changes' : 'Create Habit'}</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  screenSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewToggle: { flexDirection: 'row', borderRadius: 22, padding: 3, gap: 2 },
  toggleBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  // Grid
  gridEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  gridEmptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  gridHeaderRow: {
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
  },
  gridHabitCol: {
    width: 140, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 8, borderRightWidth: StyleSheet.hairlineWidth,
  },
  gridIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gridHabitName: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  gridDayCol: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  gridHeaderText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  gridDayLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  gridDateLabel: { fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 1 },
  gridRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  gridCheckbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  gridActionsCol: {
    width: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 6, borderLeftWidth: StyleSheet.hairlineWidth,
  },
  gridActionBtn: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  // Modal
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8, marginTop: 16, paddingHorizontal: 20 },
  input: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  optionScroll: { marginTop: 4 },
  optionContent: { paddingHorizontal: 20, gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  optionChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  iconOption: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { marginHorizontal: 20, marginTop: 24, borderRadius: 16, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
