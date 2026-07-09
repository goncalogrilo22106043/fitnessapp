import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailyProgressCard } from "../components/DailyProgressCard";
import { FeedbackPrompt } from "../components/FeedbackPrompt";
import { HardDayButton } from "../components/HardDayButton";
import { MealDetailModal } from "../components/MealDetailModal";
import { MealCard, mealTimeLabel } from "../components/MealCard";
import { NextMealCard } from "../components/NextMealCard";
import { TodayHero } from "../components/TodayHero";
import { WaterTracker } from "../components/WaterTracker";
import { WeeklyInsightsCard } from "../components/WeeklyInsightsCard";
import { WeightLogger } from "../components/WeightLogger";
import { ensureDemoSession } from "../features/auth/authApi";
import { activateHardDay, getDailyDashboard, getSubstitutions, swapMeal } from "../features/plans/planApi";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { useCreatePlan, useFeedback } from "../features/plans/useTodayPlan";
import { getProfile } from "../features/profile/profileApi";
import {
  addWater,
  addWeight,
  getMealHistory,
  getWater,
  getWeeklyInsights,
  getWeight,
  MealMoodFilter
} from "../features/progress/progressApi";
import { Card, LoadingSkeleton, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, spacing } from "../ui/theme";

const sampleMeal: PlanMeal = {
  date: new Date().toISOString().slice(0, 10),
  mealTime: "lunch",
  selected: {
    score: 0.86,
    meal: {
      id: "preview",
      name: "Bowl cremoso de frango, arroz e legumes",
      caloriesEstimate: 620,
      proteinEstimate: 42,
      dna: {
        volume: "medium",
        texture: "creamy",
        cookingTime: "standard",
        dominantFlavors: ["suave", "salgado"]
      }
    },
    rationale: ["Boa tolerancia prevista para hoje."]
  },
  alternatives: []
};

export function TodayScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();
  const [currentMeal, setCurrentMeal] = useState<PlanMeal>(sampleMeal);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [detailMeal, setDetailMeal] = useState<PlanMeal | null>(null);
  const [alternatives, setAlternatives] = useState<MealAlternative[]>([]);
  const [historyFilter, setHistoryFilter] = useState<MealMoodFilter | undefined>();
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
  const weight = useQuery({
    queryKey: ["weight"],
    queryFn: async () => {
      await ensureDemoSession();
      return getWeight();
    },
    retry: false
  });
  const mealHistory = useQuery({
    queryKey: ["meal-history", historyFilter],
    queryFn: async () => {
      await ensureDemoSession();
      return getMealHistory(historyFilter);
    },
    retry: false
  });
  const insights = useQuery({
    queryKey: ["weekly-insights"],
    queryFn: async () => {
      await ensureDemoSession();
      return getWeeklyInsights();
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
      await ensureDemoSession();
      return swapMeal({
        date: currentMeal.date,
        mealTime: currentMeal.mealTime,
        referenceMealId: currentMeal.selected.meal.id,
        selectedMealId: alternative.option.meal.id
      });
    },
    onSuccess: async () => {
      setAlternatives([]);
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
  const weightMutation = useMutation({
    mutationFn: async () => {
      await ensureDemoSession();
      const lastWeight = weight.data?.logs.at(-1)?.weightKilograms ?? 64;
      return addWeight(Math.round((lastWeight + 0.1) * 10) / 10);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["weight"] });
      await queryClient.invalidateQueries({ queryKey: ["weekly-insights"] });
    }
  });

  const dailyMeals = dashboard.data?.meals ?? [];
  const currentMealIsPreview = currentMeal.selected.meal.id === "preview";
  const nextMeal = currentMealIsPreview ? dailyMeals[0] ?? currentMeal : dailyMeals.find((meal) => meal.mealTime === currentMeal.mealTime) ?? dailyMeals[0] ?? currentMeal;
  const selectedMeal = nextMeal;
  const remainingMeals = dailyMeals.filter((meal) => meal.selected.meal.id !== nextMeal.selected.meal.id);
  const hasRealPlan = dailyMeals.length > 0 && selectedMeal.selected.meal.id !== "preview";

  const statusText = useMemo(() => {
    if (feedback.isSuccess) return "Obrigado. Vamos adaptar as proximas refeicoes.";
    if (hardDay.isSuccess) return "Hoje ajustei as proximas refeicoes para opcoes mais faceis.";
    if (createPlan.isSuccess) return "Plano atualizado para o teu ritmo de hoje.";
    return "Hoje vamos procurar refeicoes faceis de manter.";
  }, [createPlan.isSuccess, feedback.isSuccess, hardDay.isSuccess]);

  async function handleCreatePlan() {
    await ensureDemoSession();
    const plan = await createPlan.mutateAsync();
    const todayMeal = plan.meals.find((meal) => meal.date === today) ?? plan.meals[0];
    if (todayMeal) setCurrentMeal(todayMeal);
    await queryClient.invalidateQueries({ queryKey: ["daily-dashboard", today] });
  }

  function handleFeedback(mood: "loved" | "neutral" | "could_not_finish", eatenPercentage: number) {
    if (selectedMeal.selected.meal.id === "preview") return;
    feedback.mutate({
      mealId: selectedMeal.selected.meal.id,
      mealTime: selectedMeal.mealTime,
      mood,
      eatenPercentage
    });
  }

  function openMealDetail(meal: PlanMeal) {
    setCurrentMeal(meal);
    setDetailMeal(meal);
    setShowMealDetail(true);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {dashboard.isLoading ? <LoadingSkeleton lines={5} /> : null}
        {dashboard.isError ? (
          <View style={styles.planEmpty}>
            <Text style={styles.planEmptyEyebrow}>Primeiro passo</Text>
            <Text style={styles.planEmptyTitle}>Ainda nao ha plano para hoje.</Text>
            <Text style={styles.planEmptyBody}>Vou criar as refeicoes do dia com macros, tolerancia, volume e variedade em conta.</Text>
            <PrimaryButton label={createPlan.isPending ? "A gerar..." : "Gerar plano de hoje"} onPress={handleCreatePlan} disabled={createPlan.isPending} />
          </View>
        ) : (
          <TodayHero
            name={profile.data?.user.name?.split(" ")[0] ?? "Goncalo"}
            mode={profile.data?.profile?.eatingMode ?? "easy_bulking"}
            dashboard={dashboard.data}
            waterTargetMilliliters={profile.data?.profile?.dailyWaterTargetMl ?? water.data?.targetMilliliters ?? 2500}
          />
        )}

        {feedback.isSuccess || hardDay.isSuccess || createPlan.isSuccess ? (
          <View style={styles.toast}>
            <Text style={styles.toastTitle}>Atualizado</Text>
            <Text style={styles.toastText}>{statusText}</Text>
          </View>
        ) : null}

        {hasRealPlan ? (
          <NextMealCard
            meal={nextMeal}
            alternatives={alternatives}
            swapLoading={substitutions.isPending || swap.isPending}
            onView={() => openMealDetail(nextMeal)}
            onSwapRequest={(meal) => substitutions.mutate(meal)}
            onSelectAlternative={(alternative) => swap.mutate(alternative)}
            onMarkEaten={(meal) =>
              feedback.mutate({
                mealId: meal.selected.meal.id,
                mealTime: meal.mealTime,
                mood: "loved",
                eatenPercentage: 100
              })
            }
          />
        ) : null}

        {hasRealPlan ? <FeedbackPrompt onFeedback={handleFeedback} /> : null}

        <HardDayButton onPress={() => hardDay.mutate()} loading={hardDay.isPending} />

        <WaterTracker water={water.data} onAdd={(amount) => waterMutation.mutate(amount)} compact />

        {hasRealPlan ? (
          <MealCard
            meal={selectedMeal}
            alternatives={[]}
            onSwapRequest={(meal) => substitutions.mutate(meal)}
            onSelectAlternative={(alternative) => swap.mutate(alternative)}
            onMarkEaten={(meal) =>
              feedback.mutate({
                mealId: meal.selected.meal.id,
                mealTime: meal.mealTime,
                mood: "loved",
                eatenPercentage: 100
              })
            }
            onOpenDetails={openMealDetail}
          />
        ) : null}

        <Card>
          <View style={styles.sectionHeader}>
            <SectionTitle>Refeicoes restantes</SectionTitle>
            <Text style={styles.sectionMeta}>{remainingMeals.length || 0} slots</Text>
          </View>
          {remainingMeals.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Text style={styles.dailyMealName}>Nada pendente por agora.</Text>
              <Text style={styles.muted}>Quando houver mais refeicoes no plano, aparecem aqui por ordem do dia.</Text>
            </View>
          ) : (
            remainingMeals.map((meal) => (
              <Pressable key={`${meal.date}-${meal.mealTime}`} style={styles.dailyMeal} onPress={() => setCurrentMeal(meal)}>
                <View style={styles.dailyMealText}>
                  <Text style={styles.dailyMealTitle}>{mealTimeLabel[meal.mealTime]}</Text>
                  <Text style={styles.dailyMealName}>{meal.selected.meal.name}</Text>
                  <Text style={styles.muted}>{meal.selected.rationale[0]}</Text>
                </View>
              </Pressable>
            ))
          )}
        </Card>

        <DailyProgressCard dashboard={dashboard.data} />

        <WeightLogger logs={weight.data?.logs} trend={weight.data?.trend} onAdd={() => weightMutation.mutate()} />

        <Card>
          <SectionTitle>Historico de refeicoes</SectionTitle>
          <View style={styles.filterRow}>
            <PrimaryButton label="Tudo" onPress={() => setHistoryFilter(undefined)} variant="outline" />
            <PrimaryButton label="Positivo" onPress={() => setHistoryFilter("loved")} variant="outline" />
            <PrimaryButton label="Adaptar" onPress={() => setHistoryFilter("could_not_finish")} variant="outline" />
          </View>
          {mealHistory.data?.meals.length ? (
            mealHistory.data.meals.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.dailyMealName}>{item.mealName}</Text>
                <Text style={styles.muted}>{feedbackLabel[item.mood]} - {item.eatenPercentage}% comido</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Ainda nao ha refeicoes registadas neste filtro.</Text>
          )}
        </Card>

        <WeeklyInsightsCard insights={insights.data} />
        <PrimaryButton label={createPlan.isPending ? "A adaptar..." : "Gerar plano semanal"} onPress={handleCreatePlan} disabled={createPlan.isPending} />
        <MealDetailModal
          meal={detailMeal}
          visible={showMealDetail}
          alternatives={alternatives}
          swapLoading={substitutions.isPending || swap.isPending}
          onClose={() => setShowMealDetail(false)}
          onMarkEaten={(meal) =>
            feedback.mutate({
              mealId: meal.selected.meal.id,
              mealTime: meal.mealTime,
              mood: "loved",
              eatenPercentage: 100
            })
          }
          onSwapRequest={(meal) => substitutions.mutate(meal)}
          onSelectAlternative={(alternative) => swap.mutate(alternative)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const feedbackLabel = {
  loved: "Adorei",
  neutral: "Normal",
  could_not_finish: "Vamos adaptar"
};

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
  },
  historyItem: {
    backgroundColor: colors.oat,
    borderRadius: 8,
    gap: spacing.xs,
    padding: spacing.md
  }
});
