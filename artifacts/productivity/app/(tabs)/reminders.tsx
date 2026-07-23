import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Platform, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useColors } from '@/hooks/useColors';
import { useReminders } from '@/context/RemindersContext';
import { ReminderItem } from '@/components/ReminderItem';

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ReminderForm {
  title: string;
  description: string;
  hour: number;
  minute: number;
  days: number[];
}

const DEFAULT_FORM: ReminderForm = {
  title: '',
  description: '',
  hour: 9,
  minute: 0,
  days: [0, 1, 2, 3, 4, 5, 6],
};

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { reminders, notificationsEnabled, permissionStatus, requestPermission, addReminder, deleteReminder, toggleReminder } = useReminders();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<ReminderForm>(DEFAULT_FORM);

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Please enter a reminder title.');
      return;
    }
    if (form.days.length === 0) {
      Alert.alert('Select days', 'Please select at least one day.');
      return;
    }
    await addReminder({
      title: form.title,
      description: form.description,
      hour: form.hour,
      minute: form.minute,
      days: form.days,
      enabled: true,
      isDefault: false,
    });
    setModalVisible(false);
    setForm(DEFAULT_FORM);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const adjustHour = (delta: number) => setForm(f => ({ ...f, hour: (f.hour + delta + 24) % 24 }));
  const adjustMinute = (delta: number) => setForm(f => ({ ...f, minute: (f.minute + delta + 60) % 60 }));

  const defaultReminders = reminders.filter(r => r.isDefault);
  const customReminders = reminders.filter(r => !r.isDefault);
  const enabledCount = reminders.filter(r => r.enabled).length;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Reminders</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>{enabledCount} active</Text>
        </View>
        {notificationsEnabled && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.remindersColor }]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 34 + 84 : insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Permission Banner */}
        {permissionStatus === 'denied' && (
          <View style={[styles.permissionBanner, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40' }]}>
            <Ionicons name="notifications-off-outline" size={24} color={colors.destructive} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.destructive }]}>Reminders Disabled</Text>
              <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>
                Notification permission was denied. Go to Settings to enable notifications and use this feature.
              </Text>
            </View>
          </View>
        )}

        {permissionStatus === 'undetermined' && (
          <TouchableOpacity
            style={[styles.permissionBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
            onPress={requestPermission}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.primary }]}>Enable Notifications</Text>
              <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>Tap to allow notifications for daily reminders</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {notificationsEnabled && (
          <View style={[styles.enabledBanner, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={[styles.enabledText, { color: colors.success }]}>Notifications enabled</Text>
          </View>
        )}

        {/* Daily Reminders Section */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Reminders</Text>
        {defaultReminders.map(r => (
          <ReminderItem
            key={r.id}
            reminder={r}
            disabled={!notificationsEnabled}
            onToggle={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleReminder(r.id);
            }}
            onDelete={() => deleteReminder(r.id)}
          />
        ))}

        {/* Custom Reminders */}
        {customReminders.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Custom</Text>
            {customReminders.map(r => (
              <ReminderItem
                key={r.id}
                reminder={r}
                disabled={!notificationsEnabled}
                onToggle={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleReminder(r.id);
                }}
                onDelete={() => deleteReminder(r.id)}
              />
            ))}
          </>
        )}

        {notificationsEnabled && (
          <TouchableOpacity
            style={[styles.addCustomBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
            onPress={() => {
              setForm(DEFAULT_FORM);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addCustomText, { color: colors.primary }]}>Add custom reminder</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAwareScrollView style={[styles.modal, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Reminder</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Reminder title"
            placeholderTextColor={colors.mutedForeground}
            value={form.title}
            onChangeText={t => setForm(f => ({ ...f, title: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Message</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Optional message"
            placeholderTextColor={colors.mutedForeground}
            value={form.description}
            onChangeText={t => setForm(f => ({ ...f, description: t }))}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Time</Text>
          <View style={[styles.timePicker, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.timeColumn}>
              <TouchableOpacity onPress={() => adjustHour(1)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                <Ionicons name="chevron-up" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.timeValue, { color: colors.foreground }]}>
                {(form.hour % 12 === 0 ? 12 : form.hour % 12).toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity onPress={() => adjustHour(-1)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                <Ionicons name="chevron-down" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.timeSep, { color: colors.foreground }]}>:</Text>
            <View style={styles.timeColumn}>
              <TouchableOpacity onPress={() => adjustMinute(5)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                <Ionicons name="chevron-up" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.timeValue, { color: colors.foreground }]}>{form.minute.toString().padStart(2, '0')}</Text>
              <TouchableOpacity onPress={() => adjustMinute(-5)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                <Ionicons name="chevron-down" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.ampmBtn, { backgroundColor: form.hour < 12 ? colors.primary : colors.muted }]}
              onPress={() => setForm(f => ({ ...f, hour: f.hour < 12 ? f.hour + 12 : f.hour - 12 }))}
            >
              <Text style={[styles.ampmText, { color: form.hour < 12 ? '#fff' : colors.mutedForeground }]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ampmBtn, { backgroundColor: form.hour >= 12 ? colors.primary : colors.muted }]}
              onPress={() => setForm(f => ({ ...f, hour: f.hour >= 12 ? f.hour - 12 : f.hour + 12 }))}
            >
              <Text style={[styles.ampmText, { color: form.hour >= 12 ? '#fff' : colors.mutedForeground }]}>PM</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Repeat on</Text>
          <View style={styles.daysRow}>
            {DAY_NAMES.map((name, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayBtn, { backgroundColor: form.days.includes(i) ? colors.primary : colors.muted }]}
                onPress={() => toggleDay(i)}
              >
                <Text style={[styles.dayText, { color: form.days.includes(i) ? '#fff' : colors.mutedForeground }]}>{name}</Text>
              </TouchableOpacity>
            ))}
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
  content: { paddingHorizontal: 20, paddingTop: 12 },
  permissionBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  bannerTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  bannerDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  enabledBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  enabledText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  addCustomBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', marginTop: 8 },
  addCustomText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', flex: 1, textAlign: 'center' },
  saveText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8, marginTop: 16, paddingHorizontal: 20 },
  input: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  timePicker: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 20, gap: 12, justifyContent: 'center' },
  timeColumn: { alignItems: 'center', gap: 8 },
  timeValue: { fontSize: 32, fontFamily: 'Inter_700Bold', minWidth: 50, textAlign: 'center' },
  timeSep: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  ampmBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  ampmText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  daysRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap' },
  dayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  dayText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
