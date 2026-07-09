import { Pressable, StyleSheet, Text, View } from "react-native";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { Badge, Card, Metric, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, spacing, typography } from "../ui/theme";

export function MealCard({
  meal,
  alternatives,
  onSwapRequest,
  onSelectAlternative,
  onMarkEaten,
  onOpenDetails
}: {
  meal: PlanMeal;
  alternatives: MealAlternative[];
  onSwapRequest: (meal: PlanMeal) => void;
  onSelectAlternative: (alternative: MealAlternative) => void;
  onMarkEaten: (meal: PlanMeal) => void;
  onOpenDetails: (meal: PlanMeal) => void;
}) {
  const status = getMealStatus(meal);
  const calories = meal.selected.meal.caloriesEstimate;
  const protein = meal.selected.meal.proteinEstimate;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{mealTimeHour[meal.mealTime]}</Text>
          <Text style={styles.eyebrow}>{mealTimeLabel[meal.mealTime]}</Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.name}>{meal.selected.meal.name}</Text>
      <Text style={styles.microcopy}>Boa escolha - esta refeicao costuma encaixar bem no teu plano.</Text>
      <View style={styles.metrics}>
        <Metric label="Kcal" value={`${calories}`} tone="gold" />
        <Metric label="Proteina" value={`${protein}g`} tone="sage" />
        <Metric label="Volume" value={volumeLabel[meal.selected.meal.dna.volume]} />
      </View>
      <View style={styles.reasonPanel}>
        {(meal.selected.rationale.length ? meal.selected.rationale : ["Escolhi esta opcao por ter macros equilibrados e boa tolerancia prevista."]).map((item) => (
          <Text key={item} style={styles.reason}>{item}</Text>
        ))}
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Comida" onPress={() => onMarkEaten(meal)} variant="soft" />
        <PrimaryButton label="Trocar" onPress={() => onSwapRequest(meal)} variant="outline" />
        <PrimaryButton label="Detalhes" onPress={() => onOpenDetails(meal)} variant="dark" />
      </View>

      {alternatives.length > 0 ? (
        <View style={styles.alternatives}>
          <SectionTitle>Alternativas</SectionTitle>
          {alternatives.map((alternative) => (
            <Pressable key={alternative.option.meal.id} style={styles.alternative} onPress={() => onSelectAlternative(alternative)}>
              <Text style={styles.altName}>{alternative.option.meal.name}</Text>
              <Text style={styles.reason}>Sugestao: {alternative.reasons.join(", ")}.</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export const mealTimeLabel: Record<PlanMeal["mealTime"], string> = {
  breakfast: "Pequeno-almoco",
  lunch: "Almoco",
  snack: "Lanche",
  dinner: "Jantar"
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

function getMealStatus(meal: PlanMeal): { label: string; tone: "neutral" | "blue" | "sage" | "coral" | "gold" } {
  const rationale = meal.selected.rationale.join(" ").toLowerCase();
  if (meal.selected.meal.isSafeMeal || rationale.includes("safe")) return { label: "Safe meal", tone: "sage" };
  if (meal.selected.meal.isFavorite || rationale.includes("favor")) return { label: "Favorita", tone: "gold" };
  if (rationale.includes("enjoo") || meal.selected.score < 0.55) return { label: "Risco de enjoo", tone: "coral" };
  return { label: "Normal", tone: "blue" };
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timeBlock: {
    gap: spacing.xxs
  },
  time: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800"
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.muted,
  },
  microcopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  reasonPanel: {
    backgroundColor: colors.oatSoft,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.md
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  score: {
    color: colors.sage,
    fontSize: 18,
    fontWeight: "800"
  },
  name: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 31
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm
  },
  reason: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  alternatives: {
    gap: spacing.sm
  },
  alternative: {
    backgroundColor: colors.oat,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.md
  },
  altName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  }
});
