import { StyleSheet, Text, View } from "react-native";
import { DailyDashboard } from "../features/plans/types";
import { Badge, ProgressBar } from "../ui/components";
import { colors, radius, shadows, spacing, typography } from "../ui/theme";

export function TodayHero({
  name,
  mode,
  dashboard,
  waterTargetMilliliters
}: {
  name: string;
  mode: "clean_bulking" | "easy_bulking";
  dashboard: DailyDashboard | undefined;
  waterTargetMilliliters: number;
}) {
  const calorieTarget = dashboard?.calorieTarget ?? 0;
  const proteinTarget = dashboard?.proteinTarget ?? 0;
  const waterConsumed = dashboard?.hydrationMilliliters ?? 0;
  const waterProgress = waterTargetMilliliters > 0 ? Math.round((waterConsumed / waterTargetMilliliters) * 100) : 0;
  const calorieProgress = calorieTarget > 0 ? Math.round(((dashboard?.caloriesConsumed ?? 0) / calorieTarget) * 100) : 0;

  return (
    <View style={styles.hero}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Hoje</Text>
          <Text style={styles.greeting}>Bom dia, {name}</Text>
        </View>
        <Badge label={mode === "easy_bulking" ? "Bulking Facil" : "Bulking Limpo"} tone="sage" />
      </View>

      <Text style={styles.message}>Manter calorias perto da meta, com refeicoes que caibam no apetite real.</Text>

      <View style={styles.goalPanel}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalLabel}>Objetivo do dia</Text>
          <Text style={styles.goalValue}>{calorieTarget || "-"} kcal</Text>
        </View>
        <ProgressBar value={calorieProgress} tone="gold" />
      </View>

      <View style={styles.metrics}>
        <HeroMetric label="Proteina" value={`${proteinTarget || 0}g`} />
        <HeroMetric label="Agua" value={`${waterConsumed}/${waterTargetMilliliters}ml`} progress={waterProgress} />
        <HeroMetric label="Consistencia" value={`${dashboard?.consistencyScore ?? 0}%`} />
      </View>
    </View>
  );
}

function HeroMetric({ label, value, progress }: { label: string; value: string; progress?: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {typeof progress === "number" ? <ProgressBar value={progress} tone="blue" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...shadows.card,
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    gap: spacing.lg,
    padding: spacing.lg
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs
  },
  eyebrow: {
    ...typography.eyebrow,
    color: "#B9C6BD"
  },
  greeting: {
    color: colors.surface,
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 36
  },
  message: {
    color: "#DDE4DC",
    fontSize: 15,
    lineHeight: 22
  },
  goalPanel: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.md
  },
  goalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  goalLabel: {
    color: "#DDE4DC",
    fontSize: 13,
    fontWeight: "800"
  },
  goalValue: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "800"
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm
  },
  metric: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "space-between",
    minHeight: 78,
    padding: spacing.sm
  },
  metricLabel: {
    color: "#B9C6BD",
    fontSize: 11,
    fontWeight: "800"
  },
  metricValue: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800"
  }
});
