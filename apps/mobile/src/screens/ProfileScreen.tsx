import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { getProfile, recalculateTargets, updateWaterTarget } from "../features/profile/profileApi";
import { Badge, Card, EmptyState, LoadingSkeleton, Metric, PrimaryButton, ProgressMetric, SectionTitle } from "../ui/components";
import { colors, radius, spacing, typography } from "../ui/theme";

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      await ensureDemoSession();
      return getProfile();
    }
  });
  const waterTarget = useMutation({
    mutationFn: async () => updateWaterTarget((profile.data?.profile?.dailyWaterTargetMl ?? 2500) + 250),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });
  const recalc = useMutation({
    mutationFn: recalculateTargets,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });

  if (profile.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <LoadingSkeleton lines={5} />
        </View>
      </SafeAreaView>
    );
  }

  if (profile.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <EmptyState title="Nao consegui carregar o perfil agora." actionLabel="Tentar novamente" onRetry={() => profile.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>PERFIL</Text>
          <Text style={styles.title}>{profile.data?.user.name}</Text>
          <Text style={styles.subtitle}>Metas e preferencias que ajudam a Rotina a adaptar sem pressa e sem rigidez.</Text>
        </View>

        <Card>
          <View style={styles.cardHeader}>
            <SectionTitle>Corpo e objetivo</SectionTitle>
            <Badge label={profile.data?.profile?.bodyGoal === "lean_gain" ? "ganho limpo" : "objetivo ativo"} tone="sage" />
          </View>
          <View style={styles.grid}>
            <Metric label="Modo" value={profile.data?.profile?.eatingMode === "easy_bulking" ? "Facil" : "Limpo"} tone="sage" />
            <Metric label="Treino" value={`${profile.data?.routine?.trainingDaysPerWeek ?? 0}x/sem`} tone="blue" />
            <Metric label="Orcamento" value={profile.data?.budget?.level ?? profile.data?.profile?.budgetPreference ?? "-"} />
          </View>
        </Card>

        <Card>
          <SectionTitle>Nutricao</SectionTitle>
          <View style={styles.grid}>
            <Metric label="BMR" value={`${profile.data?.targets?.bmr ?? 0}`} />
            <Metric label="TDEE" value={`${profile.data?.targets?.tdee ?? 0}`} />
            <Metric label="Calorias" value={`${profile.data?.targets?.calories ?? 0}`} tone="gold" />
            <Metric label="Proteina" value={`${profile.data?.targets?.proteinGrams ?? 0}g`} tone="sage" />
          </View>
          <PrimaryButton label="Recalcular metas" onPress={() => recalc.mutate()} />
        </Card>

        <Card>
          <SectionTitle>Agua</SectionTitle>
          <ProgressMetric
            label="Objetivo diario"
            value={`${profile.data?.profile?.dailyWaterTargetMl ?? 0}ml`}
            progress={Math.min(((profile.data?.profile?.dailyWaterTargetMl ?? 0) / 3500) * 100, 100)}
            tone="blue"
          />
          <PrimaryButton label="Aumentar agua +250ml" onPress={() => waterTarget.mutate()} variant="outline" />
        </Card>

        <Card>
          <SectionTitle>Tolerancia alimentar</SectionTitle>
          <View style={styles.preferenceList}>
            <Preference label="Volume baixo" value={`${Math.round(((profile.data?.profile?.preferredVolumes ?? {}).low ?? 0) * 100)}%`} />
            <Preference label="Volume medio" value={`${Math.round(((profile.data?.profile?.preferredVolumes ?? {}).medium ?? 0) * 100)}%`} />
            <Preference label="Texturas evitadas" value={listText(profile.data?.profile?.avoidedTextures, "nenhuma")} />
            <Preference label="Alimentos seguros" value={listText(profile.data?.profile?.safeFoods, "ainda sem lista")} />
            <Preference label="Alimentos rejeitados" value={listText(profile.data?.profile?.dislikedFoods, "nenhum")} />
          </View>
        </Card>

        <Card>
          <SectionTitle>Treino e preferencias</SectionTitle>
          <View style={styles.preferenceList}>
            <Preference label="Rotina" value={`${profile.data?.routine?.trainingDaysPerWeek ?? 0} treinos por semana`} />
            <Preference label="Horario treino" value={profile.data?.routine?.trainingTime ?? "por definir"} />
            <Preference label="Cozinha" value={`${profile.data?.budget?.maxCookingMinutes ?? 0} min max.`} />
            <Preference label="Modo" value={modeLabel(profile.data?.profile?.eatingMode)} />
          </View>
        </Card>

        <Card tone="warm">
          <View style={styles.cardHeader}>
            <SectionTitle>O teu padrao alimentar</SectionTitle>
            <Badge label="Meal Genome" tone="gold" />
          </View>
          <View style={styles.preferenceList}>
            <Preference label="Maior apetite" value={profile.data?.profile?.bestAppetiteTime ?? "por descobrir"} />
            <Preference label="Menor apetite" value={profile.data?.profile?.worstAppetiteTime ?? "por descobrir"} />
            <Preference label="Volume tolerado" value={profile.data?.profile?.volumeTolerance ?? "medio"} />
            <Preference label="Dias dificeis" value={listText(profile.data?.profile?.hardEatingDays, "nenhum definido")} />
            <Preference label="Favoritos alimentares" value={listText(profile.data?.profile?.favoriteFoods, "ainda sem lista")} />
            <Preference label="Preferencia manha" value={flavorLabel(profile.data?.profile?.preferredFlavors)} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function modeLabel(mode?: string) {
  if (mode === "easy_bulking") return "Bulking Facil";
  if (mode === "balanced") return "Equilibrado";
  return "Bulking Limpo";
}

function flavorLabel(flavors?: Record<string, number>) {
  const favorite = Object.entries(flavors ?? {}).sort((left, right) => right[1] - left[1])[0]?.[0];
  return favorite ?? "por descobrir";
}

function listText(values: string[] | undefined | null, fallback: string) {
  return values && values.length > 0 ? values.join(", ") : fallback;
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.preference}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Text style={styles.preferenceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  brand: {
    color: colors.sage,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0
  },
  title: {
    ...typography.title,
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  preferenceList: {
    gap: spacing.sm
  },
  preference: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  preferenceLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  preferenceValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  item: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  }
});
