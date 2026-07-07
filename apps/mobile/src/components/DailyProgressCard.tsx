import { StyleSheet, View } from "react-native";
import { DailyDashboard } from "../features/plans/types";
import { Card, Metric, SectionTitle } from "../ui/components";
import { spacing } from "../ui/theme";

export function DailyProgressCard({ dashboard }: { dashboard: DailyDashboard | undefined }) {
  return (
    <Card>
      <SectionTitle>Hoje</SectionTitle>
      <View style={styles.grid}>
        <Metric label="Calorias" value={`${dashboard?.caloriesConsumed ?? 0}/${dashboard?.calorieTarget ?? 0}`} />
        <Metric label="Proteina" value={`${dashboard?.proteinConsumed ?? 0}/${dashboard?.proteinTarget ?? 0}g`} />
        <Metric label="Apetite" value={`${dashboard?.appetiteScore ?? 0}%`} />
        <Metric label="Variedade" value={`${dashboard?.foodVarietyIndex ?? 0}%`} />
        <Metric label="Consistencia" value={`${dashboard?.consistencyScore ?? 0}%`} />
        <Metric label="Agua" value={`${dashboard?.hydrationMilliliters ?? 0}ml`} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
