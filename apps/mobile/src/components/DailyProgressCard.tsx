import { StyleSheet, Text, View } from "react-native";
import { DailyDashboard } from "../features/plans/types";
import { Card, Metric, ProgressMetric } from "../ui/components";
import { colors, spacing, typography } from "../ui/theme";

export function DailyProgressCard({ dashboard }: { dashboard: DailyDashboard | undefined }) {
  const calorieProgress = percentage(dashboard?.caloriesConsumed, dashboard?.calorieTarget);
  const proteinProgress = percentage(dashboard?.proteinConsumed, dashboard?.proteinTarget);
  const waterProgress = percentage(dashboard?.hydrationMilliliters, 2500);

  return (
    <Card tone="dark">
      <View style={styles.heroHeader}>
        <View>
          <Text style={styles.eyebrow}>Resumo do dia</Text>
          <Text style={styles.heroTitle}>{dashboard?.caloriesConsumed ?? 0} kcal</Text>
        </View>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>{calorieProgress}%</Text>
        </View>
      </View>
      <Text style={styles.heroCopy}>
        Vamos manter o plano perto da meta, sem forcar volume quando o apetite nao ajuda.
      </Text>
      <View style={styles.progressStack}>
        <ProgressMetric
          label="Calorias"
          value={`${dashboard?.caloriesConsumed ?? 0}/${dashboard?.calorieTarget ?? 0}`}
          progress={calorieProgress}
          tone="gold"
          inverted
        />
        <ProgressMetric
          label="Proteina"
          value={`${dashboard?.proteinConsumed ?? 0}/${dashboard?.proteinTarget ?? 0}g`}
          progress={proteinProgress}
          tone="sage"
          inverted
        />
        <ProgressMetric
          label="Agua"
          value={`${dashboard?.hydrationMilliliters ?? 0}ml`}
          detail="Objetivo ajustavel no perfil"
          progress={waterProgress}
          tone="blue"
          inverted
        />
      </View>
      <View style={styles.grid}>
        <Metric label="Apetite" value={`${dashboard?.appetiteScore ?? 0}%`} tone="sage" />
        <Metric label="Variedade" value={`${dashboard?.foodVarietyIndex ?? 0}%`} tone="blue" />
        <Metric label="Consistencia" value={`${dashboard?.consistencyScore ?? 0}%`} tone="coral" />
      </View>
    </Card>
  );
}

function percentage(consumed = 0, target = 0) {
  return target > 0 ? Math.round((consumed / target) * 100) : 0;
}

const styles = StyleSheet.create({
  heroHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  eyebrow: {
    ...typography.eyebrow,
    color: "#B9C6BD"
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 44,
    marginTop: spacing.xs
  },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  heroPillText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800"
  },
  heroCopy: {
    color: "#DDE4DC",
    fontSize: 15,
    lineHeight: 22
  },
  progressStack: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 18,
    gap: spacing.md,
    padding: spacing.md
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
