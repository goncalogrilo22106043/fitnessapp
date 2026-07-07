import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { getProfile, recalculateTargets, updateWaterTarget } from "../features/profile/profileApi";
import { Card, EmptyState, Metric, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, spacing, typography } from "../ui/theme";

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
          <EmptyState title="A carregar perfil..." />
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
          <Text style={styles.subtitle}>Metas e preferencias que ajudam a Rotina a adaptar sem pressa.</Text>
        </View>

        <Card>
          <SectionTitle>Metas nutricionais</SectionTitle>
          <View style={styles.grid}>
            <Metric label="BMR" value={`${profile.data?.targets?.bmr ?? 0}`} />
            <Metric label="TDEE" value={`${profile.data?.targets?.tdee ?? 0}`} />
            <Metric label="Calorias" value={`${profile.data?.targets?.calories ?? 0}`} />
            <Metric label="Proteina" value={`${profile.data?.targets?.proteinGrams ?? 0}g`} />
            <Metric label="Agua" value={`${profile.data?.profile?.dailyWaterTargetMl ?? 0}ml`} />
            <Metric label="Modo" value={profile.data?.profile?.eatingMode === "easy_bulking" ? "Facil" : "Limpo"} />
          </View>
          <PrimaryButton label="Aumentar agua +250ml" onPress={() => waterTarget.mutate()} variant="outline" />
          <PrimaryButton label="Recalcular metas" onPress={() => recalc.mutate()} />
        </Card>

        <Card>
          <SectionTitle>Preferencias</SectionTitle>
          <Text style={styles.item}>Volume baixo: {Math.round((profile.data?.profile?.preferredVolumes.low ?? 0) * 100)}%</Text>
          <Text style={styles.item}>Texturas evitadas: {profile.data?.profile?.avoidedIngredients.join(", ") || "nenhuma"}</Text>
          <Text style={styles.item}>Orcamento: {profile.data?.budget?.level ?? profile.data?.profile?.budgetPreference}</Text>
          <Text style={styles.item}>Treino: {profile.data?.routine?.trainingDaysPerWeek ?? 0}x por semana</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  item: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  }
});
