import { StyleSheet, Text, View } from "react-native";
import { Badge, Card } from "../ui/components";
import { colors, spacing } from "../ui/theme";

export function PersonalizedReasonCard({
  title = "Porque este plano",
  reason
}: {
  title?: string;
  reason: string;
}) {
  return (
    <Card tone="warm">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Badge label="personalizado" tone="sage" />
      </View>
      <Text style={styles.reason}>{reason}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800"
  },
  reason: {
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 22
  }
});
