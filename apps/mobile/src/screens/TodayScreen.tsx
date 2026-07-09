import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeedbackPrompt } from "../components/FeedbackPrompt";
import { HardDayButton } from "../components/HardDayButton";
import { MealDetailModal } from "../components/MealDetailModal";
import { mealTimeLabel } from "../components/MealCard";
import { NextMealCard } from "../components/NextMealCard";
import { TodayHero } from "../components/TodayHero";
import { WaterTracker } from "../components/WaterTracker";
import { ensureDemoSession } from "../features/auth/authApi";
import { activateHardDay, getDailyDashboard, getSubstitutions, swapMeal } from "../features/plans/planApi";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { useCreatePlan, useFeedback } from "../features/plans/useTodayPlan";
import { getProfile } from "../features/profile/profileApi";
import { addWater, getWater } from "../features/progress/progressApi";
import { Card, LoadingSkeleton, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, spacing } from "../ui/theme";

export function TodayScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();
  const [selectedMealKey, setSelectedMealKey] = useState<string | null>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [detailMeal, setDetailMeal] = useState<PlanMeal | null>(null);
  const [feedbackMeal, setFeedbackMeal] = useState<PlanMeal | null>(null);
  const [alternatives, setAlternatives] = useState<MealAlternative[]>([]);
  const [alternativesMealKey, setAlternativesMealKey] = useState<string | null>(null);
  const createPlan = useCreatePlan();
  const feedback = useFeedback();

  const dashboard = useQuery({
    queryKey: ["daily-dashboard", today],
    queryFn: async () => {
      await ensureDemoSession();
      return getDailyDashboard(today);
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
  const water = useQuery({
    queryKey: ["water", today],
    queryFn: async () => {
      await ensureDemoSession();
      return getWater(today);
    },
    retry: false
  });
  const hardDay = useMutation({
    mutationFn: async () => {
      await ensureDemoSession();
      return activateHardDay(today);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["daily-dashboard", today] });
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
      const sourceMeal = detailMeal ?? selectedMeal;
      if (!sourceMeal) {
        throw new Error("Sem refeicao selecionada.");
      }
      await ensureDemoSession();
      return swapMeal({
        date: sourceMeal.date,
        mealTime: sourceMeal.mealTime,
        referenceMealId: sourceMeal.selected.meal.id,
        selectedMealId: alternative.option.meal.id
      });
    },
    onSuccess: async () => {
      setAlternatives([]);
      setAlternativesMealKey(null);
      setShowMealDetail(false);
      await queryClient.invalidateQueries({ queryKey: ["daily-dashboard", today] });
    }
  });
  const waterMutation = useMutation({
    mutationFn: async (amount: number) => {
      await ensureDemoSession();
      return addWater(amount);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["water", today] }),
        queryClient.invalidateQueries({ queryKey: ["daily-dashboard", today] }),
        queryClient.invalidateQueries({ queryKey: ["weekly-insights"] })
      ]);
    }
  });
  const dailyMeals = dashboard.data?.meals ?? [];
  const selectedMeal = dailyMeals.find((meal) => getMealKey(meal) === selectedMealKey) ?? dailyMeals[0] ?? null;
  const nextMeal = selectedMeal;
  const remainingMeals = nextMeal ? dailyMeals.filter((meal) => meal.selected.meal.id !== nextMeal.selected.meal.id) : [];
  const hasRealPlan = dailyMeals.length > 0;
  const nextMealAlternatives = nextMeal && alternativesMealKey === getMealKey(nextMeal) ? alternatives : [];
  const detailMealAlternatives = detailMeal && alternativesMealKey === getMealKey(detailMeal) ? alternatives : [];

  const statusText = useMemo(() => {
    if (feedback.isSuccess) return "Obrigado. Vamos adaptar as proximas refeicoes.";
    if (swap.isSuccess) return "Troca feita. Atualizei o plano diario.";
    if (hardDay.isSuccess) return "Hoje ajustei as proximas refeicoes para opcoes mais faceis.";
    if (createPlan.isSuccess) return "Plano atualizado para o teu ritmo de hoje.";
    return "Hoje vamos procurar refeicoes faceis de manter.";
  }, [createPlan.isSuccess, feedback.isSuccess, hardDay.isSuccess, swap.isSuccess]);

  async function handleCreatePlan() {
    await ensureDemoSession();
    const plan = await createPlan.mutateAsync();
    const todayMeal = plan.meals.find((meal) => meal.date === today) ?? plan.meals[0];
    if (todayMeal) setSelectedMealKey(getMealKey(todayMeal));
    await queryClient.invalidateQueries({ queryKey: ["daily-dashboard", today] });
  }

  function handleFeedback(mood: "loved" | "neutral" | "could_not_finish", eatenPercentage: number) {
    if (!feedbackMeal) return;
    feedback.mutate({
      mealId: feedbackMeal.selected.meal.id,
      mealTime: feedbackMeal.mealTime,
      mood,
      eatenPercentage
    }, {
      onSuccess: () => setFeedbackMeal(null)
    });
  }

  function openMealDetail(meal: PlanMeal) {
    setSelectedMealKey(getMealKey(meal));
    setDetailMeal(meal);
    setShowMealDetail(true);
  }

  function requestSwap(meal: PlanMeal) {
    setSelectedMealKey(getMealKey(meal));
    setDetailMeal(meal);
    setAlternativesMealKey(getMealKey(meal));
    setAlternatives([]);
    substitutions.mutate(meal);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {dashboard.isLoading ? <LoadingSkeleton lines={5} /> : null}
        {!dashboard.isLoading && !hasRealPlan ? (
          <View style={styles.planEmpty}>
            <Text style={styles.planEmptyEyebrow}>Primeiro passo</Text>
            <Text style={styles.planEmptyTitle}>Ainda nao ha plano para hoje.</Text>
            <Text style={styles.planEmptyBody}>Vou criar as refeicoes do dia com macros, tolerancia, volume e variedade em conta.</Text>
            <PrimaryButton label={createPlan.isPending ? "A gerar..." : "Gerar plano de hoje"} onPress={handleCreatePlan} disabled={createPlan.isPending} />
          </View>
        ) : hasRealPlan ? (
          <TodayHero
            name={profile.data?.user.name?.split(" ")[0] ?? "Goncalo"}
            mode={profile.data?.profile?.eatingMode ?? "easy_bulking"}
            dashboard={dashboard.data}
            waterTargetMilliliters={profile.data?.profile?.dailyWaterTargetMl ?? water.data?.targetMilliliters ?? 2500}
          />
        ) : null}

        {feedback.isSuccess || hardDay.isSuccess || createPlan.isSuccess || swap.isSuccess ? (
          <View style={styles.toast}>
            <Text style={styles.toastTitle}>Atualizado</Text>
            <Text style={styles.toastText}>{statusText}</Text>
          </View>
        ) : null}

        {nextMeal ? (
          <NextMealCard
            meal={nextMeal}
            alternatives={nextMealAlternatives}
            swapLoading={substitutions.isPending || swap.isPending}
            onView={() => openMealDetail(nextMeal)}
            onSwapRequest={requestSwap}
            onSelectAlternative={(alternative) => swap.mutate(alternative)}
            onMarkEaten={setFeedbackMeal}
          />
        ) : null}

        {feedbackMeal ? <FeedbackPrompt mealName={feedbackMeal.selected.meal.name} onFeedback={handleFeedback} /> : null}

        {hasRealPlan ? <HardDayButton onPress={() => hardDay.mutate()} loading={hardDay.isPending} /> : null}

        {hasRealPlan ? <WaterTracker water={water.data} onAdd={(amount) => waterMutation.mutate(amount)} compact /> : null}

        {hasRealPlan ? <Card>
          <View style={styles.sectionHeader}>
            <SectionTitle>Refeicoes restantes</SectionTitle>
            <Text style={styles.sectionMeta}>{remainingMeals.length} slots</Text>
          </View>
          {remainingMeals.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Text style={styles.dailyMealName}>Nada pendente por agora.</Text>
              <Text style={styles.muted}>Quando houver mais refeicoes no plano, aparecem aqui por ordem do dia.</Text>
            </View>
          ) : (
            remainingMeals.map((meal) => (
              <Pressable key={`${meal.date}-${meal.mealTime}`} style={styles.dailyMeal} onPress={() => setSelectedMealKey(getMealKey(meal))}>
                <View style={styles.dailyMealText}>
                  <Text style={styles.dailyMealTitle}>{mealTimeLabel[meal.mealTime]}</Text>
                  <Text style={styles.dailyMealName}>{meal.selected.meal.name}</Text>
                  <Text style={styles.muted}>{meal.selected.rationale[0]}</Text>
                </View>
              </Pressable>
            ))
          )}
        </Card> : null}
        <MealDetailModal
          meal={detailMeal}
          visible={showMealDetail}
          alternatives={detailMealAlternatives}
          swapLoading={substitutions.isPending || swap.isPending}
          onClose={() => setShowMealDetail(false)}
          onMarkEaten={(meal) => {
            setFeedbackMeal(meal);
            setShowMealDetail(false);
          }}
          onSwapRequest={requestSwap}
          onSelectAlternative={(alternative) => swap.mutate(alternative)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function getMealKey(meal: PlanMeal): string {
  return `${meal.date}-${meal.mealTime}-${meal.selected.meal.id}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  dailyMeal: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 82,
    justifyContent: "center",
    padding: spacing.md
  },
  planEmpty: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  planEmptyEyebrow: {
    color: colors.sage,
    fontSize: 12,
    fontWeight: "800"
  },
  planEmptyTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34
  },
  planEmptyBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionMeta: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: "800"
  },
  dailyMealText: {
    gap: spacing.xs
  },
  dailyMealTitle: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800"
  },
  dailyMealName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  inlineEmpty: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  toast: {
    backgroundColor: colors.sageSoft,
    borderColor: "#D5E3D3",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  toastTitle: {
    color: colors.sage,
    fontSize: 12,
    fontWeight: "800"
  },
  toastText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm
  }
});
