import { Pressable, StyleSheet, Text, View } from "react-native";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { Card, Metric, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, spacing } from "../ui/theme";

export function MealCard({
  meal,
  alternatives,
  onSwapRequest,
  onSelectAlternative
}: {
  meal: PlanMeal;
  alternatives: MealAlternative[];
  onSwapRequest: (meal: PlanMeal) => void;
  onSelectAlternative: (alternative: MealAlternative) => void;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.eyebrow}>{mealTimeLabel[meal.mealTime]}</Text>
        <Text style={styles.score}>{Math.round(meal.selected.score * 100)}%</Text>
      </View>
      <Text style={styles.name}>{meal.selected.meal.name}</Text>
      <View style={styles.metrics}>
        <Metric label="Proteina" value={`${meal.selected.meal.proteinEstimate}g`} />
        <Metric label="Volume" value={volumeLabel[meal.selected.meal.dna.volume]} />
        <Metric label="Textura" value={meal.selected.meal.dna.texture} />
      </View>
      {meal.selected.rationale.map((item) => (
        <Text key={item} style={styles.reason}>{item}</Text>
      ))}
      <PrimaryButton label="Trocar" onPress={() => onSwapRequest(meal)} variant="outline" />

      {alternatives.length > 0 ? (
        <View style={styles.alternatives}>
          <SectionTitle>Alternativas</SectionTitle>
          {alternatives.map((alternative) => (
            <Pressable key={alternative.option.meal.id} style={styles.alternative} onPress={() => onSelectAlternative(alternative)}>
              <Text style={styles.altName}>{alternative.option.meal.name}</Text>
              <Text style={styles.reason}>Escolhi esta opcao porque tem {alternative.reasons.join(", ")}.</Text>
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

const volumeLabel = {
  low: "Baixo",
  medium: "Medio",
  high: "Alto"
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  eyebrow: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "800"
  },
  score: {
    color: colors.sage,
    fontSize: 18,
    fontWeight: "800"
  },
  name: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30
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
