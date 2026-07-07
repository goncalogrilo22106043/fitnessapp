import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "./theme";

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  variant = "dark",
  disabled
}: {
  label: string;
  onPress: () => void;
  variant?: "dark" | "coral" | "outline";
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "coral" && styles.buttonCoral,
        variant === "outline" && styles.buttonOutline,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, variant === "outline" && styles.buttonTextOutline]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(Math.max(value, 0), 100)}%` }]} />
    </View>
  );
}

export function EmptyState({ title, actionLabel, onRetry }: { title: string; actionLabel?: string; onRetry?: () => void }) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      {actionLabel && onRetry ? <PrimaryButton label={actionLabel} onPress={onRetry} variant="outline" /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink
  },
  metric: {
    backgroundColor: colors.oat,
    borderRadius: radius.md,
    flexBasis: "31%",
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 74,
    padding: spacing.sm
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  buttonCoral: {
    backgroundColor: colors.coral
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.ink,
    borderWidth: 1
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800"
  },
  buttonTextOutline: {
    color: colors.ink
  },
  progressTrack: {
    backgroundColor: colors.oat,
    borderRadius: radius.md,
    height: 12,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.blue,
    height: 12
  },
  emptyTitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.5
  }
});
