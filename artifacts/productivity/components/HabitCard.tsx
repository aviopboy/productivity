import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
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
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = async () => {
    scale.value = withSpring(0.93, {}, () => {
      scale.value = withSpring(1);
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(habit.name, 'What would you like to do?', [
      { text: 'Edit', onPress: onEdit },
      { text: 'Delete', style: 'destructive', onPress: () => {
        Alert.alert('Delete Habit', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handleToggle}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        delayLongPress={500}
      >
        <View style={[styles.iconBox, { backgroundColor: habit.color + '20' }]}>
          <Ionicons name={habit.icon as any} size={22} color={habit.color} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>{habit.name}</Text>
          <View style={styles.meta}>
            {habit.streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#F59E0B" />
                <Text style={styles.streakText}>{habit.streak}</Text>
              </View>
            )}
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>{habit.description}</Text>
          </View>
        </View>
        <View style={[
          styles.checkCircle,
          {
            backgroundColor: completed ? habit.color : 'transparent',
            borderColor: completed ? habit.color : colors.border,
          }
        ]}>
          {completed && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#F59E0B',
  },
  desc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
