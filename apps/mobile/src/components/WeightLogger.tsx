import { Dimensions, StyleSheet, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { WeightLog, WeightTrend } from "../features/progress/progressApi";
import { Card, PrimaryButton, SectionTitle } from "../ui/components";
import { chartConfig, colors } from "../ui/theme";

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
      <Text style={styles.text}>
        Tendencia: {weightLabel[trend?.direction ?? "stable"]} ({trend?.weeklyDeltaKilograms ?? 0}kg)
      </Text>
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
        <Text style={styles.text}>Ainda nao ha peso registado.</Text>
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
    borderRadius: 8
  }
});
