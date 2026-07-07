import { Dimensions, StyleSheet, Text } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Card, SectionTitle } from "../ui/components";
import { chartConfig, colors } from "../ui/theme";

export function WeeklyInsightsCard({
  insights
}: {
  insights: {
    foodVarietyIndex: number;
    consistencyScore: number;
    hydrationAverage: number;
    suggestions: string[];
  } | undefined;
}) {
  return (
    <Card>
      <SectionTitle>Insights semanais</SectionTitle>
      <BarChart
        data={{
          labels: ["Var.", "Cons.", "Agua"],
          datasets: [{ data: [insights?.foodVarietyIndex ?? 0, insights?.consistencyScore ?? 0, Math.min((insights?.hydrationAverage ?? 0) / 25, 100)] }]
        }}
        width={Dimensions.get("window").width - 72}
        height={170}
        yAxisLabel=""
        yAxisSuffix="%"
        chartConfig={chartConfig}
        style={styles.chart}
      />
      {(insights?.suggestions.length ? insights.suggestions : ["Ainda estou a juntar dados para sugerir a proxima semana."]).map((suggestion) => (
        <Text key={suggestion} style={styles.text}>{suggestion}</Text>
      ))}
    </Card>
  );
}

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
