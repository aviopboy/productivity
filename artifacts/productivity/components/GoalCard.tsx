import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Goal } from '@/context/GoalsContext';

interface GoalCardProps {
  goal: Goal;
  progress: number;
  onPress: () => void;
}

const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#EF4444' },
  medium: { label: 'Medium', color: '#F59E0B' },
  low: { label: 'Low', color: '#22C55E' },
};

export function GoalCard({ goal, progress, onPress }: GoalCardProps) {
  const colors = useColors();
  const priority = PRIORITY_CONFIG[goal.priority];
  const completedMilestones = goal.milestones.filter(m => m.completed).length;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: goal.color }]} />
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{goal.title}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
          <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
        </View>
      </View>

      {goal.description ? (
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{goal.description}</Text>
      ) : null}

      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: goal.color }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{progress}%</Text>
      </View>

      <View style={styles.footer}>
        {goal.milestones.length > 0 && (
          <View style={styles.milestoneInfo}>
            <Ionicons name="flag-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.milestoneText, { color: colors.mutedForeground }]}>
              {completedMilestones}/{goal.milestones.length} milestones
            </Text>
          </View>
        )}
        {goal.dueDate ? (
          <View style={styles.milestoneInfo}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.milestoneText, { color: colors.mutedForeground }]}>
              {new Date(goal.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        ) : null}
        {goal.completed && (
          <View style={[styles.completedBadge, { backgroundColor: '#22C55E20' }]}>
            <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
            <Text style={styles.completedText}>Done</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  desc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    minWidth: 32,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  milestoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  milestoneText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#22C55E',
  },
});
