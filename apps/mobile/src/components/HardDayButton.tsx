import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing } from "../ui/theme";

export function HardDayButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed, loading && styles.disabled]} onPress={onPress} disabled={loading}>
      <View style={styles.copy}>
        <Text style={styles.title}>{loading ? "A adaptar o resto do dia" : "Hoje nao consigo"}</Text>
        <Text style={styles.body}>Vamos adaptar o plano ao teu apetite de hoje, com opcoes mais faceis e sem dramatizar.</Text>
      </View>
      <Text style={styles.action}>{loading ? "..." : "Adaptar"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.coralSoft,
    borderColor: "#EACDC4",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 104,
    padding: spacing.lg
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "800"
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  action: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    opacity: 0.62
  }
});
