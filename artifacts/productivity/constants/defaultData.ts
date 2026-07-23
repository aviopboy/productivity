export const DEFAULT_HABITS = [
  {
    name: 'Drink Water',
    description: 'Stay hydrated throughout the day',
    category: 'health' as const,
    icon: 'water-outline',
    color: '#3B82F6',
    isDefault: true,
  },
  {
    name: 'Exercise',
    description: '30 minutes of physical activity',
    category: 'health' as const,
    icon: 'fitness-outline',
    color: '#22C55E',
    isDefault: true,
  },
  {
    name: 'Meditate',
    description: '10 minutes of mindfulness',
    category: 'mind' as const,
    icon: 'leaf-outline',
    color: '#8B5CF6',
    isDefault: true,
  },
  {
    name: 'Read',
    description: 'Read for at least 20 minutes',
    category: 'mind' as const,
    icon: 'book-outline',
    color: '#F59E0B',
    isDefault: true,
  },
  {
    name: 'Sleep Early',
    description: 'Maintain a healthy sleep schedule',
    category: 'health' as const,
    icon: 'moon-outline',
    color: '#6366F1',
    isDefault: true,
  },
  {
    name: 'No Junk Food',
    description: 'Eat clean and nutritious meals',
    category: 'health' as const,
    icon: 'nutrition-outline',
    color: '#EF4444',
    isDefault: true,
  },
];

export const DEFAULT_REMINDERS = [
  {
    title: 'Morning Routine',
    description: 'Start your morning routine',
    hour: 7,
    minute: 0,
    days: [1, 2, 3, 4, 5],
    isDefault: true,
  },
  {
    title: 'Drink Water',
    description: 'Time to drink a glass of water',
    hour: 9,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    isDefault: true,
  },
  {
    title: 'Drink Water',
    description: 'Time to drink a glass of water',
    hour: 11,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    isDefault: true,
  },
  {
    title: 'Lunch Break',
    description: 'Step away and take a proper lunch break',
    hour: 12,
    minute: 30,
    days: [1, 2, 3, 4, 5],
    isDefault: true,
  },
  {
    title: 'Drink Water',
    description: 'Time to drink a glass of water',
    hour: 14,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    isDefault: true,
  },
  {
    title: 'Stretch Break',
    description: 'Take a quick stretch break from your desk',
    hour: 15,
    minute: 30,
    days: [1, 2, 3, 4, 5],
    isDefault: true,
  },
  {
    title: 'Drink Water',
    description: 'Time to drink a glass of water',
    hour: 17,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    isDefault: true,
  },
  {
    title: 'Practice Gratitude',
    description: 'Write 3 things you are grateful for today',
    hour: 19,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    isDefault: true,
  },
  {
    title: 'Evening Wind Down',
    description: 'Start winding down for a restful night',
    hour: 21,
    minute: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    isDefault: true,
  },
];

export const HABIT_ICONS = [
  'water-outline', 'fitness-outline', 'leaf-outline', 'book-outline',
  'moon-outline', 'nutrition-outline', 'walk-outline', 'bicycle-outline',
  'heart-outline', 'medkit-outline', 'musical-notes-outline', 'pencil-outline',
  'code-slash-outline', 'camera-outline', 'happy-outline', 'sun-outline',
  'cafe-outline', 'basketball-outline', 'bed-outline', 'phone-portrait-outline',
];

export const HABIT_COLORS = [
  '#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#6366F1', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#A855F7',
];

export const HABIT_CATEGORIES = [
  { value: 'health', label: 'Health', icon: 'heart-outline' },
  { value: 'mind', label: 'Mind', icon: 'brain-outline' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
  { value: 'social', label: 'Social', icon: 'people-outline' },
  { value: 'custom', label: 'Custom', icon: 'star-outline' },
];

export const MOOD_LABELS: Record<number, string> = {
  1: 'Awful',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

export const MOOD_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#F59E0B',
  4: '#22C55E',
  5: '#3B82F6',
};
