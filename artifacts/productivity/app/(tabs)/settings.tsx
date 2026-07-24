import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useSettings, AppSettings } from '@/context/SettingsContext';

const ACCENT_COLORS = [
  '#5B4FE9', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#D97706', '#16A34A', '#0891B2',
  '#0284C7', '#4F46E5', '#6D28D9', '#BE185D',
];

const BACKGROUND_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Default', value: null },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Cream', value: '#FAF7F2' },
  { label: 'Stone', value: '#F5F3EE' },
  { label: 'Sky', value: '#EFF6FF' },
  { label: 'Mint', value: '#F0FDF4' },
  { label: 'Rose', value: '#FFF1F2' },
  { label: 'Sand', value: '#FEFCE8' },
  { label: 'Slate', value: '#1E293B' },
  { label: 'Navy', value: '#0F172A' },
  { label: 'Charcoal', value: '#18181B' },
  { label: 'Forest', value: '#14261E' },
];

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
  );
}

function RowSeparator() {
  const colors = useColors();
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

function SettingRow({
  icon, iconColor, label, sublabel, children,
}: {
  icon: string; iconColor: string; label: string; sublabel?: string; children?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.rowLabel}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sublabel}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function SegmentedPick<T extends string>({
  value, options, onChange,
}: { value: T; options: { label: string; value: T }[]; onChange: (v: T) => void }) {
  const colors = useColors();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.muted }]}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.segment, opt.value === value && { backgroundColor: colors.primary }]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.segmentText, { color: opt.value === value ? '#fff' : colors.mutedForeground }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSetting, resetSettings } = useSettings();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings.appName);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) updateSetting('appName', trimmed);
    else setNameInput(settings.appName);
    setEditingName(false);
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset All Settings',
      'This will restore all settings to their defaults. Your habit and journal data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetSettings },
      ],
    );
  };

  const confirmClearData = () => {
    Alert.alert(
      'Clear All App Data',
      'This permanently deletes all habits, journal entries, goals, reminders, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Cleared', 'All data has been deleted. Restart the app to begin fresh.');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{settings.appName}</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Settings & Preferences</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* ── Appearance ── */}
        <SectionHeader title="Appearance" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="sunny-outline" iconColor="#F59E0B" label="Theme">
            <SegmentedPick
              value={settings.themeMode}
              options={[
                { label: 'Light', value: 'light' },
                { label: 'System', value: 'system' },
                { label: 'Dark', value: 'dark' },
              ]}
              onChange={v => updateSetting('themeMode', v as AppSettings['themeMode'])}
            />
          </SettingRow>

          <RowSeparator />

          <View style={[styles.row, { backgroundColor: colors.card }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Accent Color</Text>
            </View>
          </View>
          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, settings.accentColor === c && styles.colorDotSelected]}
                onPress={() => updateSetting('accentColor', c)}
              >
                {settings.accentColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <RowSeparator />

          <View style={[styles.row, { backgroundColor: colors.card }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#06B6D420' }]}>
              <Ionicons name="image-outline" size={20} color="#06B6D4" />
            </View>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Background</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Custom app background color</Text>
            </View>
          </View>
          <View style={[styles.bgGrid, { paddingHorizontal: 14, paddingBottom: 14 }]}>
            {BACKGROUND_OPTIONS.map(opt => {
              const selected = settings.customBackground === opt.value;
              const swatch = opt.value ?? colors.background;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.bgSwatch, { backgroundColor: swatch, borderColor: selected ? colors.primary : colors.border }]}
                  onPress={() => updateSetting('customBackground', opt.value)}
                >
                  {selected && (
                    <View style={styles.bgCheck}>
                      <Ionicons name="checkmark" size={12} color={opt.value && parseInt(opt.value.slice(1), 16) < 0x888888 ? '#fff' : '#333'} />
                    </View>
                  )}
                  <Text style={[styles.bgLabel, { color: opt.value && parseInt(opt.value.slice(1), 16) < 0x888888 ? '#ccc' : '#555' }]} numberOfLines={1}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Habits ── */}
        <SectionHeader title="Habits" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="eye-outline" iconColor="#22C55E" label="Default View">
            <SegmentedPick
              value={settings.defaultHabitView}
              options={[
                { label: 'List', value: 'list' },
                { label: 'Calendar', value: 'calendar' },
              ]}
              onChange={v => updateSetting('defaultHabitView', v as AppSettings['defaultHabitView'])}
            />
          </SettingRow>

          <RowSeparator />

          <SettingRow
            icon="flame-outline"
            iconColor="#EF4444"
            label="Show Streaks"
            sublabel="Display streak count on habit cards"
          >
            <Switch
              value={settings.showStreaks}
              onValueChange={v => updateSetting('showStreaks', v)}
              trackColor={{ true: colors.primary }}
              thumbColor="#fff"
            />
          </SettingRow>
        </View>

        {/* ── Calendar ── */}
        <SectionHeader title="Calendar" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="calendar-outline" iconColor="#0891B2" label="Week Starts On">
            <SegmentedPick
              value={String(settings.weekStartsOn) as '0' | '1'}
              options={[
                { label: 'Sunday', value: '0' },
                { label: 'Monday', value: '1' },
              ]}
              onChange={v => updateSetting('weekStartsOn', Number(v) as 0 | 1)}
            />
          </SettingRow>
        </View>

        {/* ── App Name ── */}
        <SectionHeader title="App" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { backgroundColor: colors.card }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#7C3AED20' }]}>
              <Ionicons name="pencil-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>App Name</Text>
            </View>
            {editingName ? (
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  onBlur={handleSaveName}
                  maxLength={20}
                />
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setNameInput(settings.appName); setEditingName(true); }}>
                <Text style={[styles.rowValue, { color: colors.primary }]}>{settings.appName}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Data ── */}
        <SectionHeader title="Data" />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={confirmReset}>
            <View style={[styles.rowIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="refresh-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Reset Settings</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Restore defaults, keep all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <RowSeparator />

          <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={confirmClearData}>
            <View style={[styles.rowIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </View>
            <View style={styles.rowLabel}>
              <Text style={[styles.rowTitle, { color: '#EF4444' }]}>Clear All Data</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Permanently delete everything</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          {settings.appName} · Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 60 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  rowValue: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  bgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bgSwatch: {
    width: 72, height: 52, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4, overflow: 'hidden',
  },
  bgCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  bgLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  nameRow: { flex: 1 },
  nameInput: {
    borderBottomWidth: 1.5,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    paddingVertical: 2,
    textAlign: 'right',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 32,
    marginBottom: 8,
  },
});
