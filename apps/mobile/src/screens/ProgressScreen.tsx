import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { getMealHistory, getWater, getWeeklyInsights, getWeight } from "../features/progress/progressApi";
import { Badge, Card, EmptyState, LoadingSkeleton, Metric, SectionTitle } from "../ui/components";
import { colors, spacing, typography } from "../ui/theme";

export function ProgressScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const insights = useQuery({
    queryKey: ["weekly-insights"],
    queryFn: async () => {
      await ensureDemoSession();
      return getWeeklyInsights();
    },
    retry: false
  });
  const meals = useQuery({
    queryKey: ["meal-history"],
    queryFn: async () => {
      await ensureDemoSession();
      return getMealHistory();
    },
    retry: false
  });
  const water = useQuery({
    queryKey: ["water", today],
    queryFn: async () => {
      await ensureDemoSession();
      return getWater(today);
    },
    retry: false
  });
  const weight = useQuery({
    queryKey: ["weight"],
    queryFn: async () => {
      await ensureDemoSession();
      return getWeight();
    },
    retry: false
  });

  const loading = insights.isLoading || meals.isLoading || water.isLoading || weight.isLoading;
  const hasData = Boolean(meals.data?.meals.length || water.data?.timeline.length || weight.data?.logs.length);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>PROGRESSO</Text>
          <Text style={styles.title}>Sinais da semana</Text>
          <Text style={styles.subtitle}>Peso, consistencia, hidratacao e feedback alimentar sem transformar o dia numa folha de calculo.</Text>
        </View>

        {loading ? <LoadingSkeleton lines={5} /> : null}
        {!loading && !hasData ? <EmptyState title="Ainda nao ha sinais suficientes." body="Regista refeicoes, agua e peso para construir um relatorio semanal com significado." /> : null}

        {insights.data ? (
          <Card>
            <SectionTitle>Resumo semanal</SectionTitle>
            <View style={styles.grid}>
              <Metric label="Consistencia" value={`${insights.data.consistencyScore}%`} tone="sage" />
              <Metric label="Variedade" value={`${insights.data.foodVarietyIndex}%`} tone="gold" />
              <Metric label="Agua media" value={`${insights.data.hydrationAverage}ml`} tone="blue" />
              <Metric label="Peso" value={weightText(insights.data.weightTrend.direction)} tone="coral" />
            </View>
          </Card>
        ) : null}

        {insights.data?.bestToleratedMeals.length ? (
          <Card>
            <SectionTitle>Refeicoes que resultam</SectionTitle>
            {insights.data.bestToleratedMeals.map((meal) => (
              <View key={meal.name} style={styles.item}>
                <Text style={styles.itemTitle}>{meal.name}</Text>
                <Badge label={`${meal.loved}/${meal.total} positivas`} tone="sage" />
              </View>
            ))}
          </Card>
        ) : null}

        {insights.data?.nauseaRiskMeals.length ? (
          <Card>
            <SectionTitle>Risco de enjoo</SectionTitle>
            {insights.data.nauseaRiskMeals.map((meal) => (
              <View key={meal.name} style={styles.item}>
                <Text style={styles.itemTitle}>{meal.name}</Text>
                <Badge label="reduzir repeticao" tone="coral" />
              </View>
            ))}
          </Card>
        ) : null}

        {insights.data?.suggestions.length ? (
          <Card tone="warm">
            <SectionTitle>Proxima semana</SectionTitle>
            {insights.data.suggestions.map((suggestion) => <Text key={suggestion} style={styles.suggestion}>{suggestion}</Text>)}
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function weightText(direction: string) {
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
  item: { alignItems: "center", backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", padding: spacing.md },
  itemTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  suggestion: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 }
});
