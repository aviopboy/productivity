import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Reminder } from '@/context/RemindersContext';

interface ReminderItemProps {
  reminder: Reminder;
  disabled?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

export function ReminderItem({ reminder, disabled, onToggle, onDelete }: ReminderItemProps) {
  const colors = useColors();

  const handleDelete = () => {
    Alert.alert('Delete Reminder', `Delete "${reminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const allDays = reminder.days.length === 7;
  const weekdays = [1, 2, 3, 4, 5];
  const isWeekdays = weekdays.every(d => reminder.days.includes(d)) && reminder.days.length === 5;
  const dayLabel = allDays ? 'Every day' : isWeekdays ? 'Weekdays' : reminder.days.map(d => DAY_LABELS[d]).join(', ');

  return (
    <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}>
      <View style={[styles.timeBox, { backgroundColor: colors.primary + '15' }]}>
        <Text style={[styles.time, { color: colors.primary }]}>{formatTime(reminder.hour, reminder.minute)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]}>{reminder.title}</Text>
        <View style={styles.row}>
          <Ionicons name="repeat-outline" size={11} color={colors.mutedForeground} />
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>{dayLabel}</Text>
        </View>
      </View>
      <Switch
        value={reminder.enabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: colors.primary + '80' }}
        thumbColor={reminder.enabled ? colors.primary : colors.mutedForeground}
      />
      {!reminder.isDefault && (
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  timeBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
