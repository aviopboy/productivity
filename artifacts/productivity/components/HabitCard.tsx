import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/context/SettingsContext';
import { Habit } from '@/context/HabitsContext';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, completed, onToggle, onEdit, onDelete }: HabitCardProps) {
  const colors = useColors();
  const { settings } = useSettings();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = async () => {
    scale.value = withSpring(0.95, {}, () => { scale.value = withSpring(1); });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `Delete "${habit.name}"?`,
      'This will remove the habit and all its history permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  return (
    <Animated.View style={animStyle}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: completed ? habit.color + '60' : colors.border }]}>
        {/* Left: icon */}
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={[styles.iconBox, { backgroundColor: habit.color + '20' }]}>
          <Ionicons name={habit.icon as any} size={22} color={habit.color} />
        </TouchableOpacity>

        {/* Middle: name + meta */}
        <TouchableOpacity style={styles.info} onPress={handleToggle} activeOpacity={0.7}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{habit.name}</Text>
          <View style={styles.meta}>
            {settings.showStreaks && habit.streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={11} color="#F59E0B" />
                <Text style={styles.streakText}>{habit.streak}</Text>
              </View>
            )}
            {!!habit.description && (
              <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
                {habit.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Right: edit | delete | checkbox */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.muted }]} onPress={onEdit} hitSlop={8}>
            <Ionicons name="pencil-outline" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF444418' }]} onPress={handleDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkCircle, { backgroundColor: completed ? habit.color : 'transparent', borderColor: completed ? habit.color : colors.border }]}
            onPress={handleToggle}
            hitSlop={8}
          >
            {completed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#F59E0B20', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
  },
  streakText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#F59E0B' },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
