# ORBIT — Productivity App

A full-featured native mobile productivity app built with Expo/React Native. Tracks habits, journals, goals, and daily reminders — all with a beautiful deep-indigo design.

## Run & Operate

- `pnpm --filter @workspace/productivity run dev` — run the Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native 0.81, Expo Router (file-based routing)
- State: AsyncStorage (local persistence), React Context, React Query
- Notifications: expo-notifications (local scheduled notifications)
- UI: @expo/vector-icons (Ionicons/Feather), expo-linear-gradient, react-native-svg
- Font: Inter (400/500/600/700) via @expo-google-fonts/inter

## Features

- **Habits** — Auto-seeded with 6 default habits, streak tracking, category filter, CRUD
- **Journal** — Daily entries with mood tracking (1-5), auto-creates today's entry
- **Goals** — Goals with milestones, priority levels, progress tracking
- **Reminders** — 9 pre-set daily reminders (hydration, wellness), custom reminders with time picker, notification permission gate
- **Today Dashboard** — Progress ring, habit quick-check, stats, Pomodoro focus timer
- **Pomodoro Timer** — 25/5 cycle with session counter and haptic feedback
- **Dark/Light Mode** — Full theme support via useColors() hook

## Where things live

- `artifacts/productivity/` — Expo mobile app
  - `app/(tabs)/` — Tab screens (Today, Habits, Journal, Goals, Reminders)
  - `context/` — React Context providers (Habits, Journal, Goals, Reminders)
  - `components/` — Shared UI components
  - `constants/colors.ts` — Theme tokens (light + dark)
  - `constants/defaultData.ts` — Default habits, reminders, icon/color palettes

## Architecture decisions

- **AsyncStorage only** — No backend DB for first build; all data persisted locally
- **Context providers** — Each feature domain has its own context provider stacked in `_layout.tsx`
- **Notifications gate** — Permission requested on first launch in RemindersContext; denied → notificationsEnabled=false disables the entire reminders feature
- **Habit streaks** — Calculated from `completedDates[]` array by walking backwards from today

## User preferences

- GitHub repo: https://github.com/aviopboy/productivity
- Push to GitHub after every fix

## Gotchas

- expo-notifications version must match SDK 54 (~0.32.17)
- `setNotificationHandler` must be called at module level in RemindersContext, not inside a component
- `KeyboardAwareScrollView` from react-native-keyboard-controller — use for all modal forms
