import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { getMealHistory, getWater, getWeight, MealMoodFilter } from "../features/progress/progressApi";
import { Badge, Card, EmptyState, LoadingSkeleton, SectionTitle, SelectionGroup } from "../ui/components";
import { colors, radius, spacing, typography } from "../ui/theme";

type HistoryFilter = "all" | "meals" | "water" | "weight" | "adapt";

export function HistoryScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const mealMood: MealMoodFilter | undefined = filter === "adapt" ? "could_not_finish" : undefined;

  const meals = useQuery({
    queryKey: ["meal-history", mealMood],
    queryFn: async () => {
      await ensureDemoSession();
      return getMealHistory(mealMood);
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

  const showMeals = filter === "all" || filter === "meals" || filter === "adapt";
  const showWater = filter === "all" || filter === "water";
  const showWeight = filter === "all" || filter === "weight";
  const hasAnyData =
    (showMeals && Boolean(meals.data?.meals.length)) ||
    (showWater && Boolean(water.data?.timeline.length)) ||
    (showWeight && Boolean(weight.data?.logs.length));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>HISTORICO</Text>
          <Text style={styles.title}>O que aconteceu</Text>
          <Text style={styles.subtitle}>Refeicoes, agua e peso numa linha simples para perceber padroes reais.</Text>
        </View>

        <SelectionGroup
          label="Filtrar histórico"
          helperText="Escolhe que registos queres consultar."
          options={filters}
          selectedValue={filter}
          onChange={(value) => setFilter(value as HistoryFilter)}
        />

        {meals.isLoading || water.isLoading || weight.isLoading ? <LoadingSkeleton lines={4} /> : null}

        {!hasAnyData && !meals.isLoading && !water.isLoading && !weight.isLoading ? (
          <EmptyState title="Ainda nao ha historico para este filtro." body="Quando registares refeicoes, agua ou peso, tudo aparece aqui por ordem simples." />
        ) : null}

        {showMeals && meals.data?.meals.length ? (
          <Card>
            <SectionTitle>Refeicoes comidas</SectionTitle>
            {meals.data.meals.slice(0, 20).map((meal) => (
              <View key={meal.id} style={styles.item}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>{meal.mealName}</Text>
                  <Badge label={feedbackLabel[meal.mood]} tone={meal.mood === "loved" ? "sage" : meal.mood === "could_not_finish" ? "coral" : "blue"} />
                </View>
                <Text style={styles.itemMeta}>{meal.eatenPercentage}% comido · {dateLabel(meal.occurredAt)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {showWater && water.data?.timeline.length ? (
          <Card>
            <SectionTitle>Hidratacao de hoje</SectionTitle>
            {water.data.timeline.map((log, index) => (
              <View key={`${log.occurredAt}-${index}`} style={styles.item}>
                <Text style={styles.itemTitle}>{log.amountMilliliters}ml</Text>
                <Text style={styles.itemMeta}>{timeLabel(log.occurredAt)}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {showWeight && weight.data?.logs.length ? (
          <Card>
            <SectionTitle>Peso corporal</SectionTitle>
            {weight.data.logs.slice(-12).reverse().map((log) => (
              <View key={log.id} style={styles.item}>
                <Text style={styles.itemTitle}>{log.weightKilograms}kg</Text>
                <Text style={styles.itemMeta}>{dateLabel(log.occurredAt)}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const filters: Array<{ value: HistoryFilter; label: string }> = [
  { value: "all", label: "Tudo" },
  { value: "meals", label: "Refeicoes" },
  { value: "water", label: "Agua" },
  { value: "weight", label: "Peso" },
  { value: "adapt", label: "Adaptar" }
];

const feedbackLabel = {
  loved: "positivo",
  neutral: "neutro",
  could_not_finish: "adaptar"
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.sm },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  item: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  itemTop: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  itemMeta: { color: colors.muted, fontSize: 13, lineHeight: 18 }
});
