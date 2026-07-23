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

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitCompletion, toggleHabitCompletionForDate, isCompletedToday, getTodayCompletedCount } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HabitForm>(DEFAULT_FORM);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(settings.defaultHabitView);

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (habit: Habit) => {
    setForm({
      name: habit.name,
      description: habit.description,
      category: habit.category,
      icon: habit.icon,
      color: habit.color,
    });
    setEditingId(habit.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    if (editingId) {
      await updateHabit(editingId, form);
    } else {
      await addHabit({ ...form, isDefault: false });
    }
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filtered = filter === 'all' ? habits : habits.filter(h => h.category === filter);
  const completedToday = getTodayCompletedCount();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
          {/* View toggle */}
          <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.primary }]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'calendar' && { backgroundColor: colors.primary }]}
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons name="calendar-outline" size={18} color={viewMode === 'calendar' ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'calendar' ? (
        /* ── Calendar view ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }}
        >
          <HabitCalendar
            habits={habits}
            onToggleDate={(habitId, dateStr) => toggleHabitCompletionForDate(habitId, dateStr)}
          />
        </ScrollView>
      ) : (
        /* ── List view ── */
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {[{ value: 'all', label: 'All', icon: 'apps-outline' }, ...HABIT_CATEGORIES].map(cat => (
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
            <EmptyState
              icon="checkmark-circle-outline"
              title="No habits yet"
              description="Tap the + button to add your first habit and start building routines"
            />
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
              contentContainerStyle={[
                styles.list,
                { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }
              ]}
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
            placeholder="e.g. Drink water"
            placeholderTextColor={colors.mutedForeground}
            value={form.name}
            onChangeText={t => setForm(f => ({ ...f, name: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Optional description"
            placeholderTextColor={colors.mutedForeground}
            value={form.description}
            onChangeText={t => setForm(f => ({ ...f, description: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll} contentContainerStyle={styles.optionContent}>
            {HABIT_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.optionChip, { backgroundColor: form.category === cat.value ? colors.primary : colors.muted }]}
                onPress={() => setForm(f => ({ ...f, category: cat.value as any }))}
              >
                <Text style={[styles.optionChipText, { color: form.category === cat.value ? '#fff' : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
          <View style={styles.colorGrid}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorDotSelected]}
                onPress={() => setForm(f => ({ ...f, color: c }))}
              >
                {form.color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {HABIT_ICONS.map(ic => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconOption, { backgroundColor: form.icon === ic ? form.color + '30' : colors.muted, borderColor: form.icon === ic ? form.color : 'transparent' }]}
                onPress={() => setForm(f => ({ ...f, icon: ic }))}
              >
                <Ionicons name={ic as any} size={22} color={form.icon === ic ? form.color : colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  screenSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewToggle: { flexDirection: 'row', borderRadius: 22, padding: 3, gap: 2 },
  toggleBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { marginTop: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8, marginTop: 16, paddingHorizontal: 20 },
  input: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
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
