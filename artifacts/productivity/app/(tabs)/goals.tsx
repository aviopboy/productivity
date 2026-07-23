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
import { useGoals, Goal, GoalMilestone } from '@/context/GoalsContext';
import { GoalCard } from '@/components/GoalCard';
import { EmptyState } from '@/components/EmptyState';
import { HABIT_COLORS } from '@/constants/defaultData';

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const CATEGORIES = ['Health', 'Career', 'Finance', 'Education', 'Personal', 'Fitness', 'Other'];
const PRIORITIES = [
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'low', label: 'Low', color: '#22C55E' },
];

interface GoalForm {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  color: string;
  milestones: GoalMilestone[];
  completed: boolean;
}

const DEFAULT_FORM: GoalForm = {
  title: '',
  description: '',
  category: 'Personal',
  priority: 'medium',
  dueDate: '',
  color: '#5B4FE9',
  milestones: [],
  completed: false,
};

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone, getProgress } = useGoals();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalForm>(DEFAULT_FORM);
  const [newMilestone, setNewMilestone] = useState('');

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setModalVisible(true);
  };

  const openDetail = (goal: Goal) => {
    setSelectedGoal(goal);
    setDetailModalVisible(true);
  };

  const openEdit = (goal: Goal) => {
    setForm({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      dueDate: goal.dueDate,
      color: goal.color,
      milestones: goal.milestones,
      completed: goal.completed,
    });
    setEditingId(goal.id);
    setDetailModalVisible(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please enter a goal title.');
      return;
    }
    if (editingId) {
      await updateGoal(editingId, form);
    } else {
      await addGoal(form);
    }
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return;
    setForm(f => ({
      ...f,
      milestones: [...f.milestones, { id: generateId(), text: newMilestone.trim(), completed: false }],
    }));
    setNewMilestone('');
  };

  const handleRemoveMilestone = (id: string) => {
    setForm(f => ({ ...f, milestones: f.milestones.filter(m => m.id !== id) }));
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Goal', 'Delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteGoal(id);
        setDetailModalVisible(false);
        setSelectedGoal(null);
      }},
    ]);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  // Keep selectedGoal in sync
  const syncedSelectedGoal = selectedGoal ? goals.find(g => g.id === selectedGoal.id) ?? null : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Goals</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            {activeGoals.length} active · {completedGoals.length} completed
          </Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.goalsColor }]} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <EmptyState icon="flag-outline" title="No goals yet" description="Set your first goal and break it down into milestones" />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={g => g.id}
          renderItem={({ item }) => (
            <GoalCard goal={item} progress={getProgress(item)} onPress={() => openDetail(item)} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Goal Detail Modal */}
      <Modal visible={detailModalVisible && !!syncedSelectedGoal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailModalVisible(false)}>
        {syncedSelectedGoal && (
          <ScrollView style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>{syncedSelectedGoal.title}</Text>
              <TouchableOpacity onPress={() => openEdit(syncedSelectedGoal)}>
                <Ionicons name="pencil-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailSection}>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { width: `${getProgress(syncedSelectedGoal)}%` as any, backgroundColor: syncedSelectedGoal.color }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>{getProgress(syncedSelectedGoal)}% complete</Text>
            </View>

            {syncedSelectedGoal.description ? (
              <Text style={[styles.detailDesc, { color: colors.mutedForeground }]}>{syncedSelectedGoal.description}</Text>
            ) : null}

            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Milestones</Text>
            {syncedSelectedGoal.milestones.length === 0 ? (
              <Text style={[styles.noMilestones, { color: colors.mutedForeground }]}>No milestones added</Text>
            ) : (
              syncedSelectedGoal.milestones.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.milestoneRow, { borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleMilestone(syncedSelectedGoal.id, m.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.mCheck, { borderColor: m.completed ? syncedSelectedGoal.color : colors.border, backgroundColor: m.completed ? syncedSelectedGoal.color : 'transparent' }]}>
                    {m.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.milestoneText, { color: m.completed ? colors.mutedForeground : colors.foreground, textDecorationLine: m.completed ? 'line-through' : 'none' }]}>
                    {m.text}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[styles.deleteGoalBtn, { borderColor: colors.destructive + '40', backgroundColor: colors.destructive + '10' }]}
              onPress={() => handleDelete(syncedSelectedGoal.id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              <Text style={[styles.deleteGoalText, { color: colors.destructive }]}>Delete Goal</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAwareScrollView style={[styles.modal, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editingId ? 'Edit Goal' : 'New Goal'}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Goal Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="What do you want to achieve?"
            placeholderTextColor={colors.mutedForeground}
            value={form.title}
            onChangeText={t => setForm(f => ({ ...f, title: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, height: 80 }]}
            placeholder="Why is this goal important?"
            placeholderTextColor={colors.mutedForeground}
            value={form.description}
            onChangeText={t => setForm(f => ({ ...f, description: t }))}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.priorityBtn, { backgroundColor: form.priority === p.value ? p.color : colors.muted }]}
                onPress={() => setForm(f => ({ ...f, priority: p.value as any }))}
              >
                <Text style={[styles.priorityText, { color: form.priority === p.value ? '#fff' : colors.mutedForeground }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, { backgroundColor: form.category === cat ? colors.primary : colors.muted }]}
                onPress={() => setForm(f => ({ ...f, category: cat }))}
              >
                <Text style={[styles.catText, { color: form.category === cat ? '#fff' : colors.mutedForeground }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
          <View style={[styles.colorGrid, { paddingHorizontal: 20 }]}>
            {HABIT_COLORS.slice(0, 8).map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, form.color === c && styles.colorDotSelected]}
                onPress={() => setForm(f => ({ ...f, color: c }))}
              >
                {form.color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Milestones</Text>
          {form.milestones.map(m => (
            <View key={m.id} style={[styles.milestoneEdit, { borderColor: colors.border }]}>
              <Text style={[styles.milestoneEditText, { color: colors.foreground }]}>{m.text}</Text>
              <TouchableOpacity onPress={() => handleRemoveMilestone(m.id)}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addMilestoneRow}>
            <TextInput
              style={[styles.milestoneInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Add a milestone..."
              placeholderTextColor={colors.mutedForeground}
              value={newMilestone}
              onChangeText={setNewMilestone}
              onSubmitEditing={handleAddMilestone}
              returnKeyType="done"
            />
            <TouchableOpacity style={[styles.addMilestoneBtn, { backgroundColor: colors.primary }]} onPress={handleAddMilestone}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  screenSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 12 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', flex: 1, marginHorizontal: 12 },
  saveText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8, marginTop: 16, paddingHorizontal: 20 },
  input: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  priorityRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  priorityBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  priorityText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  milestoneEdit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  milestoneEditText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addMilestoneRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 8 },
  milestoneInput: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addMilestoneBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailSection: { paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  detailDesc: { paddingHorizontal: 20, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  sectionLabel: { paddingHorizontal: 20, fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  noMilestones: { paddingHorizontal: 20, fontSize: 14, fontFamily: 'Inter_400Regular' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  mCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  milestoneText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  deleteGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 20, padding: 14, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  deleteGoalText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
