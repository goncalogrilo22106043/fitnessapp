import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { createWeeklyPlan, getLatestWeeklyPlan, getSubstitutions, swapMeal } from "../features/plans/planApi";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { getProfile } from "../features/profile/profileApi";
import { Badge, Card, EmptyState, LoadingSkeleton, Metric, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, spacing, typography } from "../ui/theme";
import { mealTimeLabel } from "../components/MealCard";

export function WeeklyPlanScreen() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [swapMealTarget, setSwapMealTarget] = useState<PlanMeal | null>(null);
  const [alternatives, setAlternatives] = useState<MealAlternative[]>([]);

  const plan = useQuery({
    queryKey: ["weekly-plan-latest"],
    queryFn: async () => {
      await ensureDemoSession();
      return getLatestWeeklyPlan();
    },
    retry: false
  });
  const profile = useQuery({
    queryKey: ["profile-lite"],
    queryFn: async () => {
      await ensureDemoSession();
      return getProfile();
    },
    retry: false
  });

  const generate = useMutation({
    mutationFn: async () => {
      await ensureDemoSession();
      return createWeeklyPlan(today);
    },
    onSuccess: async (nextPlan) => {
      setSelectedDate(nextPlan.meals[0]?.date ?? null);
      await queryClient.invalidateQueries({ queryKey: ["weekly-plan-latest"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] });
    }
  });

  const substitutions = useMutation({
    mutationFn: async (meal: PlanMeal) => {
      await ensureDemoSession();
      return getSubstitutions({
        date: meal.date,
        mealTime: meal.mealTime,
        referenceMealId: meal.selected.meal.id
      });
    },
    onSuccess: (response) => setAlternatives(response.alternatives)
  });

  const swap = useMutation({
    mutationFn: async (alternative: MealAlternative) => {
      if (!swapMealTarget) throw new Error("Sem refeicao selecionada.");
      await ensureDemoSession();
      return swapMeal({
        date: swapMealTarget.date,
        mealTime: swapMealTarget.mealTime,
        referenceMealId: swapMealTarget.selected.meal.id,
        selectedMealId: alternative.option.meal.id
      });
    },
    onSuccess: async () => {
      setAlternatives([]);
      setSwapMealTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] });
    }
  });

  const days = useMemo(() => groupMealsByDay(plan.data?.meals ?? []), [plan.data?.meals]);
  const activeDate = selectedDate ?? days[0]?.date ?? null;

  function requestSwap(meal: PlanMeal) {
    setSwapMealTarget(meal);
    setAlternatives([]);
    substitutions.mutate(meal);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>PLANO</Text>
          <Text style={styles.title}>Semana alimentar</Text>
          <Text style={styles.subtitle}>Uma vista limpa da semana, com totais por dia e trocas quando precisares.</Text>
        </View>

        {plan.isLoading ? <LoadingSkeleton lines={5} /> : null}

        {!plan.isLoading && days.length === 0 ? (
          <EmptyState
            title="Ainda nao ha plano semanal."
            body="Gera uma semana para ver refeicoes, macros e variedade por dia."
            actionLabel={generate.isPending ? "A gerar..." : "Gerar nova semana"}
            onRetry={() => generate.mutate()}
          />
        ) : null}

        {days.length > 0 ? (
          <>
            <PrimaryButton label={generate.isPending ? "A gerar..." : "Gerar nova semana"} onPress={() => generate.mutate()} disabled={generate.isPending} />
            <View style={styles.groupHeader}>
              <Text style={styles.groupLabel}>Escolher dia da semana</Text>
              <Text style={styles.groupHelper}>Seleciona o dia que queres ver em detalhe.</Text>
            </View>
            <View style={styles.dayStrip}>
              {days.map((day) => (
                <Pressable
                  key={day.date}
                  style={[styles.dayPill, activeDate === day.date && styles.dayPillActive]}
                  onPress={() => setSelectedDate(day.date)}
                >
                  <Text style={[styles.dayLabel, activeDate === day.date && styles.dayLabelActive]}>{weekday(day.date)}</Text>
                  <Text style={[styles.dayMeta, activeDate === day.date && styles.dayLabelActive]}>{day.meals.length} refs</Text>
                </Pressable>
              ))}
            </View>

            {days.map((day) => (
              activeDate === day.date ? (
                <Card key={day.date}>
                  <View style={styles.cardHeader}>
                    <View>
                      <SectionTitle>{longDate(day.date)}</SectionTitle>
                      <Text style={styles.muted}>{day.meals.length} refeicoes planeadas</Text>
                    </View>
                    <View style={styles.badgeStack}>
                      <Badge label={isTrainingDay(day.date, profile.data?.routine?.trainingDays ?? []) ? "treino" : "descanso"} tone={isTrainingDay(day.date, profile.data?.routine?.trainingDays ?? []) ? "blue" : "neutral"} />
                      <Badge label={`Variedade ${day.variety}%`} tone={day.variety >= 75 ? "sage" : "gold"} />
                    </View>
                  </View>
                  <View style={styles.metrics}>
                    <Metric label="Kcal" value={`${day.calories}`} tone="gold" />
                    <Metric label="Proteina" value={`${day.protein}g`} tone="sage" />
                  </View>
                  {day.meals.map((meal) => (
                    <View key={`${meal.date}-${meal.mealTime}`} style={styles.mealRow}>
                      <View style={styles.mealText}>
                        <Text style={styles.mealTime}>{mealTimeLabel[meal.mealTime]}</Text>
                        <Text style={styles.mealName}>{meal.selected.meal.name}</Text>
                        <Text style={styles.muted}>{meal.selected.rationale[0]}</Text>
                      </View>
                      <PrimaryButton label={substitutions.isPending && swapMealTarget?.selected.meal.id === meal.selected.meal.id ? "..." : "Trocar"} onPress={() => requestSwap(meal)} variant="outline" />
                    </View>
                  ))}
                </Card>
              ) : null
            ))}

            {swapMealTarget ? (
              <Card tone="warm">
                <SectionTitle>Alternativas para {mealTimeLabel[swapMealTarget.mealTime]}</SectionTitle>
                <Text style={styles.groupHelper}>Escolhe uma alternativa para substituir esta refeicao no plano.</Text>
                {alternatives.length === 0 ? (
                  <Text style={styles.muted}>{substitutions.isPending ? "A procurar alternativas reais..." : "Sem alternativas encontradas para esta refeicao."}</Text>
                ) : alternatives.map((alternative) => (
                  <Pressable key={alternative.option.meal.id} style={styles.altRow} onPress={() => swap.mutate(alternative)}>
                    <Text style={styles.mealName}>{alternative.option.meal.name}</Text>
                    <Text style={styles.muted}>{alternative.reasons.join(", ")}</Text>
                  </Pressable>
                ))}
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function groupMealsByDay(meals: PlanMeal[]) {
  const grouped = new Map<string, PlanMeal[]>();
  for (const meal of meals) {
    grouped.set(meal.date, [...(grouped.get(meal.date) ?? []), meal]);
  }

  return Array.from(grouped.entries()).map(([date, dayMeals]) => {
    const calories = dayMeals.reduce((total, meal) => total + meal.selected.meal.caloriesEstimate, 0);
    const protein = dayMeals.reduce((total, meal) => total + meal.selected.meal.proteinEstimate, 0);
    const variety = Math.round((new Set(dayMeals.map((meal) => meal.selected.meal.id)).size / Math.max(dayMeals.length, 1)) * 100);

    return { date, meals: dayMeals, calories, protein, variety };
  });
}

function weekday(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-PT", { weekday: "short" });
}

function longDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "short" });
}

function isTrainingDay(date: string, trainingDays: string[]) {
  const day = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return trainingDays.includes(day);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.sm },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  dayStrip: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  groupHeader: { gap: spacing.xs },
  groupLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  groupHelper: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  dayPill: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, minWidth: 74, padding: spacing.md },
  dayPillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayLabel: { color: colors.ink, fontSize: 14, fontWeight: "800", textTransform: "capitalize" },
  dayLabelActive: { color: colors.surface },
  dayMeta: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: spacing.xs },
  cardHeader: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  badgeStack: { alignItems: "flex-end", gap: spacing.xs },
  metrics: { flexDirection: "row", gap: spacing.sm },
  mealRow: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  mealText: { gap: spacing.xs },
  mealTime: { color: colors.coral, fontSize: 12, fontWeight: "800" },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  altRow: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md }
});
