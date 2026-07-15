import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreen } from "./src/screens/AuthScreen";
import { EatingScreen } from "./src/screens/EatingScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { WeeklyPlanScreen } from "./src/screens/WeeklyPlanScreen";
import { getProfile } from "./src/features/profile/profileApi";
import { colors, radius, shadows, spacing } from "./src/ui/theme";

const queryClient = new QueryClient();
type MainTab = "today" | "plan" | "eating" | "progress" | "profile";

const tabs: Array<{ key: MainTab; label: string }> = [
  { key: "today", label: "Hoje" },
  { key: "plan", label: "Plano" },
  { key: "eating", label: "Comer" },
  { key: "progress", label: "Progresso" },
  { key: "profile", label: "Perfil" }
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<MainTab>("today");

  async function handleAuthenticated() {
    setAuthenticated(true);
    try {
      const profile = await getProfile();
      setOnboarded(Boolean(profile.targets && profile.mealSlots.length > 0));
    } catch {
      setOnboarded(false);
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {!authenticated ? (
          <AuthScreen onAuthenticated={handleAuthenticated} />
        ) : onboarded ? (
          <View style={styles.shell}>
            <View style={styles.content}>{renderTab(tab)}</View>
            <View style={styles.tabs}>
              {tabs.map((item) => (
                <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.activeTab]} onPress={() => setTab(item.key)}>
                  <Text style={[styles.tabText, tab === item.key && styles.activeTabText]} numberOfLines={1} adjustsFontSizeToFit>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <OnboardingScreen onDone={() => setOnboarded(true)} />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function renderTab(tab: MainTab) {
  if (tab === "plan") return <WeeklyPlanScreen />;
  if (tab === "eating") return <EatingScreen />;
  if (tab === "progress") return <ProgressScreen />;
  if (tab === "profile") return <ProfileScreen />;
  return <TodayScreen />;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1
  },
  content: {
    flex: 1
  },
  tabs: {
    ...shadows.soft,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    margin: spacing.md,
    padding: spacing.sm
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.xs
  },
  activeTab: {
    backgroundColor: colors.ink
  },
  tabText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  activeTabText: {
    color: colors.surface
  }
});
