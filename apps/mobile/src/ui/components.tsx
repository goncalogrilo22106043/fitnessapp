import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "./theme";

export function Card({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warm" | "dark" }) {
  return <View style={[styles.card, tone === "warm" && styles.cardWarm, tone === "dark" && styles.cardDark]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "blue" | "sage" | "coral" | "gold" }) {
  return (
    <View style={[styles.metric, tone === "blue" && styles.metricBlue, tone === "sage" && styles.metricSage, tone === "coral" && styles.metricCoral, tone === "gold" && styles.metricGold]}>
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
  variant?: "dark" | "coral" | "outline" | "soft";
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "coral" && styles.buttonCoral,
        variant === "outline" && styles.buttonOutline,
        variant === "soft" && styles.buttonSoft,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, (variant === "outline" || variant === "soft") && styles.buttonTextOutline]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "sage" | "coral" | "gold" }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          tone === "sage" && styles.progressSage,
          tone === "coral" && styles.progressCoral,
          tone === "gold" && styles.progressGold,
          { width: `${Math.min(Math.max(value, 0), 100)}%` }
        ]}
      />
    </View>
  );
}

export function ProgressMetric({
  label,
  value,
  detail,
  progress,
  tone = "blue",
  inverted = false
}: {
  label: string;
  value: string;
  detail?: string;
  progress: number;
  tone?: "blue" | "sage" | "coral" | "gold";
  inverted?: boolean;
}) {
  return (
    <View style={styles.progressMetric}>
      <View style={styles.progressMetricHeader}>
        <Text style={[styles.progressLabel, inverted && styles.progressLabelInverted]}>{label}</Text>
        <Text style={[styles.progressValue, inverted && styles.progressValueInverted]}>{value}</Text>
      </View>
      <ProgressBar value={progress} tone={tone} />
      {detail ? <Text style={[styles.progressDetail, inverted && styles.progressDetailInverted]}>{detail}</Text> : null}
    </View>
  );
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "blue" | "sage" | "coral" | "gold" }) {
  return (
    <View style={[styles.badge, tone === "blue" && styles.badgeBlue, tone === "sage" && styles.badgeSage, tone === "coral" && styles.badgeCoral, tone === "gold" && styles.badgeGold]}>
      <Text style={[styles.badgeText, tone === "blue" && styles.badgeTextBlue, tone === "sage" && styles.badgeTextSage, tone === "coral" && styles.badgeTextCoral, tone === "gold" && styles.badgeTextGold]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onRetry
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <Card tone="warm">
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {actionLabel && onRetry ? <PrimaryButton label={actionLabel} onPress={onRetry} variant="outline" /> : null}
    </Card>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      {Array.from({ length: lines }).map((_, index) => (
        <View key={index} style={[styles.skeleton, index === lines - 1 && styles.skeletonShort]} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  cardWarm: {
    backgroundColor: colors.surfaceWarm
  },
  cardDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.ink
  },
  metric: {
    backgroundColor: colors.oatSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 86,
    padding: spacing.md
  },
  metricBlue: {
    backgroundColor: colors.blueSoft,
    borderColor: "#D4E1F0"
  },
  metricSage: {
    backgroundColor: colors.sageSoft,
    borderColor: "#D5E3D3"
  },
  metricCoral: {
    backgroundColor: colors.coralSoft,
    borderColor: "#EBD2CA"
  },
  metricGold: {
    backgroundColor: colors.goldSoft,
    borderColor: "#E5D4A9"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800"
  },
  button: {
    ...shadows.soft,
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  buttonCoral: {
    backgroundColor: colors.coral
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.ink,
    borderWidth: 1
  },
  buttonSoft: {
    backgroundColor: colors.oatSoft,
    borderColor: colors.line,
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
    backgroundColor: colors.oatSoft,
    borderRadius: radius.pill,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.blue,
    borderRadius: radius.pill,
    height: 10
  },
  progressSage: {
    backgroundColor: colors.sage
  },
  progressCoral: {
    backgroundColor: colors.coral
  },
  progressGold: {
    backgroundColor: colors.gold
  },
  progressMetric: {
    gap: spacing.sm
  },
  progressMetricHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  progressLabelInverted: {
    color: "#DDE4DC"
  },
  progressValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  progressValueInverted: {
    color: colors.surface
  },
  progressDetail: {
    color: colors.subtle,
    fontSize: 12,
    lineHeight: 17
  },
  progressDetailInverted: {
    color: "#B9C6BD"
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.oatSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeBlue: {
    backgroundColor: colors.blueSoft
  },
  badgeSage: {
    backgroundColor: colors.sageSoft
  },
  badgeCoral: {
    backgroundColor: colors.coralSoft
  },
  badgeGold: {
    backgroundColor: colors.goldSoft
  },
  badgeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  badgeTextBlue: {
    color: colors.blue
  },
  badgeTextSage: {
    color: colors.sage
  },
  badgeTextCoral: {
    color: colors.coral
  },
  badgeTextGold: {
    color: colors.gold
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  skeleton: {
    backgroundColor: colors.oatSoft,
    borderRadius: radius.pill,
    height: 16
  },
  skeletonShort: {
    width: "62%"
  },
  pressed: {
    opacity: 0.78
  },
  disabled: {
    opacity: 0.5
  }
});
