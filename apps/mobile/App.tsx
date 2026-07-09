import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { colors, radius, shadows, spacing } from "./src/ui/theme";

const queryClient = new QueryClient();

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<"today" | "profile">("today");

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {onboarded ? (
          <View style={styles.shell}>
            <View style={styles.content}>{tab === "today" ? <TodayScreen /> : <ProfileScreen />}</View>
            <View style={styles.tabs}>
              <Pressable style={[styles.tab, tab === "today" && styles.activeTab]} onPress={() => setTab("today")}>
                <Text style={[styles.tabText, tab === "today" && styles.activeTabText]}>Hoje</Text>
              </Pressable>
              <Pressable style={[styles.tab, tab === "profile" && styles.activeTab]} onPress={() => setTab("profile")}>
                <Text style={[styles.tabText, tab === "profile" && styles.activeTabText]}>Perfil</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <OnboardingScreen onDone={() => setOnboarded(true)} />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
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
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.sm
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 44,
    justifyContent: "center"
  },
  activeTab: {
    backgroundColor: colors.ink
  },
  tabText: {
    color: colors.ink,
    fontWeight: "800"
  },
  activeTabText: {
    color: colors.surface
  }
});
