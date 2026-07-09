import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, SectionTitle } from "../ui/components";
import { colors, radius, spacing } from "../ui/theme";

export function FeedbackPrompt({
  onFeedback
}: {
  onFeedback: (mood: "loved" | "neutral" | "could_not_finish", eatenPercentage: number) => void;
}) {
  return (
    <Card tone="warm">
      <SectionTitle>Como correu?</SectionTitle>
      <Text style={styles.copy}>O teu feedback ajusta as proximas escolhas sem mudares nada manualmente.</Text>
      <View style={styles.row}>
        <FeedbackButton label="Adorei" symbol="+" onPress={() => onFeedback("loved", 100)} />
        <FeedbackButton label="Normal" symbol="=" onPress={() => onFeedback("neutral", 75)} />
        <FeedbackButton label="Adaptar" symbol="-" onPress={() => onFeedback("could_not_finish", 35)} />
      </View>
    </Card>
  );
}

function FeedbackButton({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.symbol}>{symbol}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm
  },
  copy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 92,
    padding: spacing.sm
  },
  symbol: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: "800"
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  pressed: {
    opacity: 0.78
  }
});
