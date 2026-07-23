import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useJournal, JournalEntry } from '@/context/JournalContext';
import { JournalCard } from '@/components/JournalCard';
import { EmptyState } from '@/components/EmptyState';
import { MOOD_COLORS, MOOD_LABELS } from '@/constants/defaultData';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface JournalForm {
  title: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  date: string;
}

const MOOD_ICONS: Record<number, string> = {
  1: 'sad-outline',
  2: 'sad-outline',
  3: 'happy-outline',
  4: 'happy-outline',
  5: 'happy-outline',
};

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { entries, addEntry, updateEntry, deleteEntry, todayEntry } = useJournal();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JournalForm>({ title: '', content: '', mood: 3, date: getTodayStr() });

  const openToday = () => {
    if (todayEntry) {
      setForm({ title: todayEntry.title, content: todayEntry.content, mood: todayEntry.mood, date: todayEntry.date });
      setEditingId(todayEntry.id);
    } else {
      setForm({ title: '', content: '', mood: 3, date: getTodayStr() });
      setEditingId(null);
    }
    setModalVisible(true);
  };

  const openEntry = (entry: JournalEntry) => {
    setForm({ title: entry.title, content: entry.content, mood: entry.mood, date: entry.date });
    setEditingId(entry.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.content.trim() && !form.title.trim()) {
      Alert.alert('Empty entry', 'Please write something before saving.');
      return;
    }
    if (editingId) {
      await updateEntry(editingId, { title: form.title, content: form.content, mood: form.mood });
    } else {
      await addEntry({ title: form.title, content: form.content, mood: form.mood, date: form.date });
    }
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert('Delete Entry', 'Delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteEntry(editingId);
        setModalVisible(false);
      }},
    ]);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Journal</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>{entries.length} entries</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.journalColor }]} onPress={openToday}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Today's Card */}
      <TouchableOpacity style={[styles.todayCard, { backgroundColor: colors.journalColor + '15', borderColor: colors.journalColor + '40' }]} onPress={openToday}>
        <Ionicons name="sunny-outline" size={20} color={colors.journalColor} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.todayLabel, { color: colors.journalColor }]}>Today</Text>
          <Text style={[styles.todayHint, { color: colors.mutedForeground }]}>
            {todayEntry ? (todayEntry.content.substring(0, 60) + (todayEntry.content.length > 60 ? '...' : '')) : 'How are you feeling today? Tap to write...'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      {entries.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Your journal is empty"
          description="Tap the + button to write your first entry and track your thoughts"
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          renderItem={({ item }) => (
            <JournalCard entry={item} onPress={() => openEntry(item)} isToday={item.date === getTodayStr()} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Journal Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAwareScrollView style={[styles.modal, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Mood Picker */}
          <View style={styles.moodSection}>
            <Text style={[styles.moodLabel, { color: colors.mutedForeground }]}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodBtn, { backgroundColor: form.mood === m ? MOOD_COLORS[m] + '30' : colors.muted, borderColor: form.mood === m ? MOOD_COLORS[m] : 'transparent', borderWidth: 2 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm(f => ({ ...f, mood: m }));
                  }}
                >
                  <Text style={{ fontSize: 22 }}>
                    {m === 1 ? '😢' : m === 2 ? '😕' : m === 3 ? '😐' : m === 4 ? '🙂' : '😄'}
                  </Text>
                  <Text style={[styles.moodName, { color: form.mood === m ? MOOD_COLORS[m] : colors.mutedForeground }]}>{MOOD_LABELS[m]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
            placeholder="Entry title (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={form.title}
            onChangeText={t => setForm(f => ({ ...f, title: t }))}
          />

          <TextInput
            style={[styles.contentInput, { color: colors.foreground }]}
            placeholder="Write about your day, thoughts, or feelings..."
            placeholderTextColor={colors.mutedForeground}
            value={form.content}
            onChangeText={t => setForm(f => ({ ...f, content: t }))}
            multiline
            textAlignVertical="top"
            autoFocus={!form.content}
          />

          {editingId && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete entry</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 60 }} />
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
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  todayLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  todayHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  saveText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  moodSection: { paddingHorizontal: 20, marginBottom: 16 },
  moodLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 12 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 14, gap: 4 },
  moodName: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  titleInput: {
    marginHorizontal: 20,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  contentInput: {
    marginHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 26,
    minHeight: 200,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
