import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ensureDemoSession } from "../features/auth/authApi";
import { getMealDetail, setMealFavorite, setMealSafe } from "../features/meals/mealApi";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { Badge, Metric, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, shadows, spacing, typography } from "../ui/theme";
import { mealTimeLabel } from "./MealCard";

export function MealDetailModal({
  meal,
  visible,
  alternatives,
  swapLoading,
  onClose,
  onMarkEaten,
  onSwapRequest,
  onSelectAlternative
}: {
  meal: PlanMeal | null;
  visible: boolean;
  alternatives: MealAlternative[];
  swapLoading: boolean;
  onClose: () => void;
  onMarkEaten: (meal: PlanMeal) => void;
  onSwapRequest: (meal: PlanMeal) => void;
  onSelectAlternative: (alternative: MealAlternative) => void;
}) {
  const queryClient = useQueryClient();
  const mealId = meal?.selected.meal.id;
  const detail = useQuery({
    queryKey: ["meal-detail", mealId],
    queryFn: async () => {
      await ensureDemoSession();
      return getMealDetail(mealId ?? "");
    },
    enabled: visible && Boolean(mealId) && mealId !== "preview",
    retry: false
  });

  const favorite = useMutation({
    mutationFn: async () => {
      if (!mealId) throw new Error("Meal missing");
      await ensureDemoSession();
      const enabled = !(detail.data?.meal.isFavorite ?? meal?.selected.meal.isFavorite);
      return setMealFavorite(mealId, enabled);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["meal-detail", mealId] }),
        queryClient.invalidateQueries({ queryKey: ["profile-lite"] })
      ]);
    }
  });

  const safeMeal = useMutation({
    mutationFn: async () => {
      if (!mealId) throw new Error("Meal missing");
      await ensureDemoSession();
      const enabled = !(detail.data?.meal.isSafeMeal ?? meal?.selected.meal.isSafeMeal);
      return setMealSafe(mealId, enabled);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["meal-detail", mealId] }),
        queryClient.invalidateQueries({ queryKey: ["profile-lite"] })
      ]);
    }
  });

  if (!meal) return null;

  const current = detail.data?.meal;
  const dna = current?.dna ?? meal.selected.meal.dna;
  const ingredients = current?.ingredients ?? meal.selected.meal.ingredients ?? [];
  const recipeSteps = current?.recipeSteps ?? meal.selected.meal.recipeSteps ?? [];
  const lastFeedback = current?.lastFeedback;
  const isFavorite = current?.isFavorite ?? meal.selected.meal.isFavorite ?? false;
  const isSafeMeal = current?.isSafeMeal ?? meal.selected.meal.isSafeMeal ?? false;
  const carbs = current?.carbsEstimate ?? meal.selected.meal.carbsEstimate;
  const fat = current?.fatEstimate ?? meal.selected.meal.fatEstimate;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.topBar}>
            <Text style={styles.eyebrow}>{mealTimeLabel[meal.mealTime]} · {mealTimeHour[meal.mealTime]}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Fechar</Text>
            </Pressable>
          </View>

          <View style={styles.visual}>
            <Text style={styles.visualText}>{meal.selected.meal.name.slice(0, 1)}</Text>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{meal.selected.meal.name}</Text>
            <View style={styles.badgeRow}>
              <Badge label={isFavorite ? "Favorita" : "Normal"} tone={isFavorite ? "gold" : "blue"} />
              <Badge label={isSafeMeal ? "Safe meal" : "Adaptavel"} tone={isSafeMeal ? "sage" : "neutral"} />
            </View>
          </View>

          <View style={styles.metrics}>
            <Metric label="Kcal" value={`${current?.caloriesEstimate ?? meal.selected.meal.caloriesEstimate}`} tone="gold" />
            <Metric label="Proteina" value={`${current?.proteinEstimate ?? meal.selected.meal.proteinEstimate}g`} tone="sage" />
            <Metric label="Hidratos" value={typeof carbs === "number" ? `${carbs}g` : "-"} tone="blue" />
            <Metric label="Gordura" value={typeof fat === "number" ? `${fat}g` : "-"} />
            <Metric label="Score" value={`${Math.round(meal.selected.score * 100)}%`} tone="sage" />
          </View>

          <InfoPanel title="Porque escolhi" body={meal.selected.rationale[0] ?? "Escolhi esta opcao por equilibrar macros, volume e tolerancia."} />

          {detail.isLoading ? <InfoPanel title="A carregar" body="Estou a buscar ingredientes, receita e historico desta refeicao." /> : null}
          {detail.isError ? <InfoPanel title="Nao consegui carregar tudo" body="Mostro os dados do plano agora. Tenta novamente daqui a pouco." tone="error" /> : null}

          <View style={styles.dnaPanel}>
            <SectionTitle>Meal DNA</SectionTitle>
            <View style={styles.badgeRow}>
              <Badge label={`Volume ${volumeLabel[dna.volume]}`} tone={dna.volume === "low" ? "sage" : "blue"} />
              <Badge label={`Textura ${dna.texture}`} tone="blue" />
              <Badge label={`Prep ${dna.cookingTime}`} tone="gold" />
            </View>
            <Text style={styles.bodyText}>{dna.dominantFlavors?.join(", ") || "Sem sabores definidos ainda."}</Text>
          </View>

          <DetailSection title="Ingredientes" empty="Ingredientes ainda nao definidos na API." items={ingredients} />
          <DetailSection title="Receita" empty="Passos de receita ainda nao definidos na API." items={recipeSteps} numbered />
          <View style={styles.section}>
            <SectionTitle>Historico</SectionTitle>
            {lastFeedback ? (
              <Text style={styles.bodyText}>Ultimo feedback: {feedbackLabel[lastFeedback.mood]}, {lastFeedback.eatenPercentage}% comido.</Text>
            ) : (
              <Text style={styles.bodyText}>Ainda nao ha feedback registado nesta refeicao.</Text>
            )}
            {current?.feedbackHistory.length ? current.feedbackHistory.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyMood}>{feedbackLabel[item.mood]} · {item.eatenPercentage}%</Text>
                <Text style={styles.bodyText}>{new Date(item.occurredAt).toLocaleDateString("pt-PT")}</Text>
              </View>
            )) : null}
          </View>

          <View style={styles.actionGroup}>
            <Text style={styles.groupLabel}>Ações da refeição</Text>
            <View style={styles.actions}>
              <PrimaryButton label="Marcar como comida" onPress={() => onMarkEaten(meal)} variant="dark" />
              <PrimaryButton label={swapLoading ? "A procurar..." : "Trocar"} onPress={() => onSwapRequest(meal)} variant="outline" disabled={swapLoading} />
            </View>
          </View>
          <View style={styles.actionGroup}>
            <Text style={styles.groupLabel}>Preferências desta refeição</Text>
            <View style={styles.actions}>
              <PrimaryButton label={favorite.isPending ? "..." : isFavorite ? "Remover favorita" : "Favorita"} onPress={() => favorite.mutate()} variant="soft" disabled={favorite.isPending} />
              <PrimaryButton label={safeMeal.isPending ? "..." : isSafeMeal ? "Remover safe" : "Safe meal"} onPress={() => safeMeal.mutate()} variant="soft" disabled={safeMeal.isPending} />
            </View>
          </View>
          {favorite.isSuccess || safeMeal.isSuccess ? (
            <InfoPanel title="Guardado" body="Atualizei as tuas preferencias para as proximas escolhas." />
          ) : null}
          {favorite.isError || safeMeal.isError ? (
            <InfoPanel title="Nao consegui guardar" body="Tenta novamente daqui a pouco." tone="error" />
          ) : null}

          {alternatives.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle>Alternativas</SectionTitle>
              <Text style={styles.bodyText}>Escolhe uma alternativa para atualizar o plano diario.</Text>
              {alternatives.map((alternative) => (
                <Pressable key={alternative.option.meal.id} style={styles.alternative} onPress={() => onSelectAlternative(alternative)}>
                  <Text style={styles.altName}>{alternative.option.meal.name}</Text>
                  <Text style={styles.bodyText}>{alternative.reasons.join(", ")}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailSection({ title, items, empty, numbered }: { title: string; items: string[]; empty: string; numbered?: boolean }) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {items.length ? items.map((item, index) => (
        <Text key={`${title}-${item}`} style={styles.bodyText}>{numbered ? `${index + 1}. ` : ""}{item}</Text>
      )) : <Text style={styles.bodyText}>{empty}</Text>}
    </View>
  );
}

function InfoPanel({ title, body, tone = "default" }: { title: string; body: string; tone?: "default" | "error" }) {
  return (
    <View style={[styles.infoPanel, tone === "error" && styles.errorPanel]}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
    </View>
  );
}

const feedbackLabel = {
  loved: "Adorei",
  neutral: "Normal",
  could_not_finish: "Adaptar"
};

const mealTimeHour: Record<PlanMeal["mealTime"], string> = {
  breakfast: "08:30",
  lunch: "13:00",
  snack: "17:00",
  dinner: "20:30"
};

const volumeLabel = {
  low: "Baixo",
  medium: "Medio",
  high: "Alto"
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.muted
  },
  closeButton: {
    backgroundColor: colors.oatSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  closeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  visual: {
    ...shadows.card,
    alignItems: "center",
    aspectRatio: 1.75,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.xl,
    justifyContent: "center"
  },
  visualText: {
    color: colors.sage,
    fontSize: 64,
    fontWeight: "800"
  },
  header: {
    gap: spacing.md
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 36
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  dnaPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  infoPanel: {
    backgroundColor: colors.oatSoft,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.md
  },
  errorPanel: {
    backgroundColor: colors.coralSoft
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  bodyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionGroup: {
    gap: spacing.sm
  },
  groupLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  alternative: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  altName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  historyItem: {
    backgroundColor: colors.oatSoft,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xxs,
    padding: spacing.md
  },
  historyMood: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  }
});
