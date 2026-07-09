import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { getWeeklyInsights } from "../features/progress/progressApi";
import { Badge, Card, EmptyState, LoadingSkeleton, Metric, ProgressMetric, SectionTitle } from "../ui/components";
import { colors, radius, spacing, typography } from "../ui/theme";

export function InsightsScreen() {
  const insights = useQuery({
    queryKey: ["weekly-insights"],
    queryFn: async () => {
      await ensureDemoSession();
      return getWeeklyInsights();
    },
    retry: false
  });

  const hasSignal = Boolean(
    insights.data &&
    (insights.data.bestToleratedMeals.length > 0 ||
      insights.data.nauseaRiskMeals.length > 0 ||
      insights.data.hydrationAverage > 0 ||
      insights.data.consistencyScore > 0 ||
      insights.data.foodVarietyIndex > 0)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>INSIGHTS</Text>
          <Text style={styles.title}>Sinais da semana</Text>
          <Text style={styles.subtitle}>Leituras curtas para ajustar a proxima semana sem transformar comida numa auditoria.</Text>
        </View>

        {insights.isLoading ? <LoadingSkeleton lines={5} /> : null}

        {!insights.isLoading && !hasSignal ? (
          <EmptyState title="Ainda estou a juntar dados." body="Depois de alguns feedbacks, agua e peso, os sinais semanais aparecem aqui." />
        ) : null}

        {insights.data && hasSignal ? (
          <>
            <Card tone="dark">
              <SectionTitle>Consistencia</SectionTitle>
              <ProgressMetric
                label="Semana"
                value={`${insights.data.consistencyScore}%`}
                progress={insights.data.consistencyScore}
                detail="Baseado nas refeicoes registadas."
                tone="sage"
                inverted
              />
              <View style={styles.grid}>
                <Metric label="Variedade" value={`${insights.data.foodVarietyIndex}%`} tone="blue" />
                <Metric label="Agua media" value={`${insights.data.hydrationAverage}ml`} tone="blue" />
                <Metric label="Peso" value={weightCopy(insights.data.weightTrend.direction)} tone="gold" />
              </View>
            </Card>

            <Card>
              <SectionTitle>Refeicoes que resultaram</SectionTitle>
              {insights.data.bestToleratedMeals.length ? insights.data.bestToleratedMeals.map((meal) => (
                <View key={meal.name} style={styles.item}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemTitle}>{meal.name}</Text>
                    <Badge label={`${meal.loved}/${meal.total} positivas`} tone="sage" />
                  </View>
                </View>
              )) : <Text style={styles.muted}>Ainda nao ha feedback positivo suficiente para destacar refeicoes.</Text>}
            </Card>

            <Card>
              <SectionTitle>Risco de enjoo</SectionTitle>
              {insights.data.nauseaRiskMeals.length ? insights.data.nauseaRiskMeals.map((meal) => (
                <View key={meal.name} style={styles.item}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemTitle}>{meal.name}</Text>
                    <Badge label={`${meal.hard} sinais`} tone="coral" />
                  </View>
                </View>
              )) : <Text style={styles.muted}>Sem sinais fortes de enjoo alimentar esta semana.</Text>}
            </Card>

            <Card tone="warm">
              <SectionTitle>Proxima semana</SectionTitle>
              {insights.data.suggestions.map((suggestion) => (
                <Text key={suggestion} style={styles.suggestion}>{suggestion}</Text>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function weightCopy(direction: "up" | "down" | "stable") {
  if (direction === "up") return "a subir";
  if (direction === "down") return "a descer";
  return "estavel";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.sm },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  item: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  itemTop: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  suggestion: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, color: colors.ink, fontSize: 14, fontWeight: "700", lineHeight: 20, padding: spacing.md }
});
