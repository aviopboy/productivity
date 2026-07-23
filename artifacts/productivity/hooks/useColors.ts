import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { SettingsContext } from '@/context/SettingsContext';

/**
 * Returns design tokens for the active color scheme, respecting the
 * user's theme override (light / dark / system) and custom accent color
 * set in SettingsContext.
 */
export function useColors() {
  const { settings } = useContext(SettingsContext);
  const systemScheme = useColorScheme();

  const resolvedScheme =
    settings.themeMode === 'system' ? systemScheme : settings.themeMode;

  const palette =
    resolvedScheme === 'dark' && 'dark' in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;

  return {
    ...palette,
    radius: colors.radius,
    // User-chosen accent overrides primary / tint tokens
    primary: settings.accentColor,
    tint: settings.accentColor,
    habitColor: settings.accentColor,
  };
}
