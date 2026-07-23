import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { JournalEntry } from '@/context/JournalContext';
import { MOOD_COLORS, MOOD_LABELS } from '@/constants/defaultData';

interface JournalCardProps {
  entry: JournalEntry;
  onPress: () => void;
  isToday?: boolean;
}

export function JournalCard({ entry, onPress, isToday }: JournalCardProps) {
  const colors = useColors();
  const moodColor = MOOD_COLORS[entry.mood] ?? colors.primary;
  const moodLabel = MOOD_LABELS[entry.mood] ?? '';
  const dateObj = new Date(entry.date + 'T00:00:00');
  const displayDate = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.dateRow}>
          {isToday && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{displayDate}</Text>
        </View>
        <View style={[styles.moodBadge, { backgroundColor: moodColor + '20' }]}>
          <Ionicons name="happy-outline" size={12} color={moodColor} />
          <Text style={[styles.moodText, { color: moodColor }]}>{moodLabel}</Text>
        </View>
      </View>
      {entry.title ? (
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{entry.title}</Text>
      ) : null}
      {entry.content ? (
        <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>{entry.content}</Text>
      ) : (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>Tap to write...</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moodText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  preview: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  empty: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
});
