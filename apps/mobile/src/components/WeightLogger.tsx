import { Dimensions, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { WeightLog, WeightTrend } from "../features/progress/progressApi";
import { Badge, Card, PrimaryButton, SectionTitle } from "../ui/components";
import { chartConfig, colors, radius, spacing } from "../ui/theme";

export function WeightLogger({
  logs,
  trend,
  onAdd
}: {
  logs: WeightLog[] | undefined;
  trend: WeightTrend | undefined;
  onAdd: () => void;
}) {
  const recent = logs?.slice(-7) ?? [];

  return (
    <Card>
      <SectionTitle>Peso corporal</SectionTitle>
      <Badge label={`${weightLabel[trend?.direction ?? "stable"]} ${trend?.weeklyDeltaKilograms ?? 0}kg/sem`} tone={trend?.direction === "up" ? "sage" : "blue"} />
      {recent.length > 0 ? (
        <LineChart
          data={{
            labels: recent.map((log) => new Date(log.occurredAt).toLocaleDateString([], { day: "2-digit" })),
            datasets: [{ data: recent.map((log) => log.weightKilograms) }]
          }}
          width={Dimensions.get("window").width - 72}
          height={170}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Ainda nao ha peso registado.</Text>
          <Text style={styles.text}>Quando registares alguns dias, mostramos uma tendencia semanal simples.</Text>
        </View>
      )}
      <PrimaryButton label="Registar peso de hoje" onPress={onAdd} variant="outline" />
    </Card>
  );
}

const weightLabel = {
  up: "a subir",
  down: "a descer",
  stable: "estavel"
};

const styles = StyleSheet.create({
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
