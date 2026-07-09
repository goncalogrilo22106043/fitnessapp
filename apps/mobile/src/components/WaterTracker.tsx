import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { WaterSummary } from "../features/progress/progressApi";
import { Card, PrimaryButton, ProgressMetric, SectionTitle } from "../ui/components";
import { chartConfig, colors, radius, spacing } from "../ui/theme";

export function WaterTracker({
  water,
  onAdd,
  compact = false
}: {
  water: WaterSummary | undefined;
  onAdd: (amount: number) => void;
  compact?: boolean;
}) {
  const labels = water?.timeline.slice(-4).map((log) => new Date(log.occurredAt).toLocaleTimeString([], { hour: "2-digit" })) ?? [];
  const data = water?.timeline.slice(-4).map((log) => log.amountMilliliters) ?? [];

  return (
    <Card>
      <SectionTitle>Hidratacao</SectionTitle>
      <ProgressMetric
        label="Hoje"
        value={`${water?.consumedMilliliters ?? 0}/${water?.targetMilliliters ?? 2500}ml`}
        progress={water?.progress ?? 0}
        detail="Pequenos registos contam. Nao precisa ser perfeito."
        tone="blue"
      />
      <View style={styles.row}>
        <PrimaryButton label="200ml" onPress={() => onAdd(200)} variant="outline" />
        <PrimaryButton label="300ml" onPress={() => onAdd(300)} variant="soft" />
        {!compact ? <PrimaryButton label="500ml" onPress={() => onAdd(500)} variant="outline" /> : null}
      </View>
      {!compact && data.length > 0 ? (
        <LineChart
          data={{ labels, datasets: [{ data }] }}
          width={Dimensions.get("window").width - 72}
          height={150}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      ) : !compact ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Ainda nao ha agua registada hoje.</Text>
          <Text style={styles.text}>Adiciona o primeiro copo quando fizer sentido.</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm
  },
  text: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  chart: {
    borderRadius: radius.lg
  },
  emptyPanel: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  }
});
