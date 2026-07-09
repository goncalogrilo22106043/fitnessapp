import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MealAlternative, PlanMeal } from "../features/plans/types";
import { Badge } from "../ui/components";
import { colors, radius, shadows, spacing, typography } from "../ui/theme";
import { mealTimeLabel } from "./MealCard";

export function NextMealCard({
  meal,
  alternatives,
  swapLoading,
  onView,
  onMarkEaten,
  onSwapRequest,
  onSelectAlternative
}: {
  meal: PlanMeal;
  alternatives: MealAlternative[];
  swapLoading: boolean;
  onView: () => void;
  onMarkEaten: (meal: PlanMeal) => void;
  onSwapRequest: (meal: PlanMeal) => void;
  onSelectAlternative: (alternative: MealAlternative) => void;
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const reason = meal.selected.rationale[0] ?? "Escolhi esta opcao por equilibrar macros, volume e tolerancia.";

  function handleSwap() {
    setShowAlternatives(true);
    onSwapRequest(meal);
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>Proxima refeicao</Text>
          <Text style={styles.time}>{mealTimeHour[meal.mealTime]}</Text>
        </View>
        <Badge label={mealTimeLabel[meal.mealTime]} tone="blue" />
      </View>

      <View style={styles.main}>
        <Text style={styles.name}>{meal.selected.meal.name}</Text>
        <Text style={styles.reason}>{reason}</Text>
      </View>

      <View style={styles.quickStats}>
        <Stat label="Kcal" value={`${meal.selected.meal.caloriesEstimate}`} />
        <Stat label="Proteina" value={`${meal.selected.meal.proteinEstimate}g`} />
        <Stat label="Volume" value={volumeLabel[meal.selected.meal.dna.volume]} />
      </View>

      <View style={styles.actions}>
        <ActionButton label="Ver refeicao" onPress={onView} variant="outline" />
        <ActionButton label="Comida" onPress={() => onMarkEaten(meal)} variant="soft" />
        <ActionButton label={swapLoading ? "..." : "Trocar"} onPress={handleSwap} disabled={swapLoading} />
      </View>

      {showAlternatives && alternatives.length > 0 ? (
        <View style={styles.alternatives}>
          {alternatives.map((alternative) => (
            <Pressable key={alternative.option.meal.id} style={styles.alternative} onPress={() => onSelectAlternative(alternative)}>
              <Text style={styles.altName}>{alternative.option.meal.name}</Text>
              <Text style={styles.altReason}>{alternative.reasons.join(", ")}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant = "dark",
  disabled
}: {
  label: string;
  onPress: () => void;
  variant?: "dark" | "outline" | "soft";
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        variant === "outline" && styles.actionButtonOutline,
        variant === "soft" && styles.actionButtonSoft,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.actionText, variant !== "dark" && styles.actionTextDark]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

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
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.coral
  },
  time: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34,
    marginTop: spacing.xs
  },
  main: {
    gap: spacing.sm
  },
  name: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 33
  },
  reason: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  quickStats: {
    flexDirection: "row",
    gap: spacing.sm
  },
  stat: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  statValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.sm
  },
  actionButtonOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.ink,
    borderWidth: 1
  },
  actionButtonSoft: {
    backgroundColor: colors.oatSoft,
    borderColor: colors.line,
    borderWidth: 1
  },
  actionText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800"
  },
  actionTextDark: {
    color: colors.ink
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.5
  },
  alternatives: {
    gap: spacing.sm
  },
  alternative: {
    backgroundColor: colors.oatSoft,
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
  altReason: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  }
});
