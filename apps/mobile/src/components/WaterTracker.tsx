import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { WaterSummary } from "../features/progress/progressApi";
import { Card, PrimaryButton, ProgressBar, SectionTitle } from "../ui/components";
import { chartConfig, colors, spacing } from "../ui/theme";

export function WaterTracker({
  water,
  onAdd
}: {
  water: WaterSummary | undefined;
  onAdd: (amount: number) => void;
}) {
  const labels = water?.timeline.slice(-4).map((log) => new Date(log.occurredAt).toLocaleTimeString([], { hour: "2-digit" })) ?? [];
  const data = water?.timeline.slice(-4).map((log) => log.amountMilliliters) ?? [];

  return (
    <Card>
      <SectionTitle>Hidratacao</SectionTitle>
      <ProgressBar value={water?.progress ?? 0} />
      <Text style={styles.text}>{water?.consumedMilliliters ?? 0}/{water?.targetMilliliters ?? 2500}ml hoje</Text>
      <View style={styles.row}>
        <PrimaryButton label="200ml" onPress={() => onAdd(200)} variant="outline" />
        <PrimaryButton label="300ml" onPress={() => onAdd(300)} variant="outline" />
        <PrimaryButton label="500ml" onPress={() => onAdd(500)} variant="outline" />
      </View>
      {data.length > 0 ? (
        <LineChart
          data={{ labels, datasets: [{ data }] }}
          width={Dimensions.get("window").width - 72}
          height={150}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={styles.text}>Ainda nao ha agua registada hoje.</Text>
      )}
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
    borderRadius: 8
  }
});
