import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { getMealOptions, setMealFavorite, setMealSafe } from "../features/meals/mealApi";
import { AiMealIdea, generateMealIdeas, getPantry, savePantryItems } from "../features/pantry/pantryApi";
import { Badge, Card, EmptyState, LoadingSkeleton, PrimaryButton, SectionTitle, SelectionGroup } from "../ui/components";
import { colors, radius, spacing, typography } from "../ui/theme";

type Filter = "all" | "breakfast" | "lunch" | "snack" | "dinner" | "low" | "creamy" | "liquid" | "favorite" | "safe" | "paused";

export function EatingScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [pantryText, setPantryText] = useState("iogurte grego, aveia, whey, banana, wraps, ovos, arroz");
  const [mealTime, setMealTime] = useState<AiMealIdea["mealTime"]>("snack");
  const [notes, setNotes] = useState("Quero algo fácil para comer agora.");
  const meals = useQuery({
    queryKey: ["meal-options", filter],
    queryFn: async () => {
      await ensureDemoSession();
      return getMealOptions(filterToQuery(filter));
    },
    retry: false
  });
  const pantry = useQuery({
    queryKey: ["pantry"],
    queryFn: async () => {
      await ensureDemoSession();
      return getPantry();
    },
    retry: false
  });
  const savePantry = useMutation({
    mutationFn: async () => {
      await ensureDemoSession();
      return savePantryItems(toPantryItems(pantryText));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pantry"] });
    }
  });
  const ideas = useMutation({
    mutationFn: async () => {
      await ensureDemoSession();
      return generateMealIdeas({ mealTime, notes });
    }
  });
  const favorite = useMutation({
    mutationFn: async (input: { id: string; enabled: boolean }) => setMealFavorite(input.id, input.enabled),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meal-options"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] })
      ]);
    }
  });
  const safe = useMutation({
    mutationFn: async (input: { id: string; enabled: boolean }) => setMealSafe(input.id, input.enabled),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meal-options"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-dashboard"] })
      ]);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>COMER</Text>
          <Text style={styles.title}>O que posso comer?</Text>
          <Text style={styles.subtitle}>Diz o que tens em casa. A app usa isso, o teu perfil e a AI para sugerir opções reais.</Text>
        </View>

        <Card tone="warm">
          <SectionTitle>Tenho em casa</SectionTitle>
          <Text style={styles.reason}>Escreve alimentos separados por vírgulas. Isto fica guardado e entra nas próximas sugestões.</Text>
          <TextInput
            style={styles.textArea}
            value={pantryText}
            onChangeText={setPantryText}
            multiline
            placeholder="ex: iogurte, aveia, ovos, arroz, frango..."
            placeholderTextColor={colors.subtle}
          />
          <PrimaryButton label={savePantry.isPending ? "A guardar..." : "Guardar despensa"} onPress={() => savePantry.mutate()} disabled={savePantry.isPending} />
          {pantry.data?.items.length ? (
            <View style={styles.chips}>
              {pantry.data.items.filter((item) => item.available).slice(0, 18).map((item) => <Badge key={item.id} label={item.name} tone="sage" />)}
            </View>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>Gerar com AI</SectionTitle>
          <SelectionGroup
            label="Para que refeição?"
            options={[
              { value: "breakfast", label: "Pequeno-almoço" },
              { value: "lunch", label: "Almoço" },
              { value: "snack", label: "Lanche" },
              { value: "dinner", label: "Jantar" }
            ]}
            selectedValue={mealTime}
            onChange={(value) => setMealTime(value as AiMealIdea["mealTime"])}
          />
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="ex: estou sem apetite, quero doce, pouco volume..."
            placeholderTextColor={colors.subtle}
          />
          <PrimaryButton label={ideas.isPending ? "A gerar..." : "Sugerir o que comer agora"} onPress={() => ideas.mutate()} disabled={ideas.isPending} />
          {ideas.data ? (
            <View style={styles.aiState}>
              <Badge label={ideas.data.usedAi ? "AI ativa" : "fallback local"} tone={ideas.data.usedAi ? "sage" : "gold"} />
              <Text style={styles.reason}>{ideas.data.message}</Text>
            </View>
          ) : null}
        </Card>

        {ideas.data?.ideas.map((idea) => (
          <Card key={`${idea.title}-${idea.estimatedCalories}`}>
            <View style={styles.mealHeader}>
              <View style={styles.mealText}>
                <Text style={styles.mealName}>{idea.title}</Text>
                <Text style={styles.mealMeta}>{idea.estimatedCalories} kcal · {idea.estimatedProteinGrams}g proteína · volume {idea.volume}</Text>
              </View>
              <Badge label="AI" tone="blue" />
            </View>
            <Text style={styles.reason}>{idea.why}</Text>
            <View style={styles.aiList}>
              <Text style={styles.groupLabel}>Usa o que tens</Text>
              <Text style={styles.reason}>{idea.ingredientsToUse.join(", ") || "sem ingredientes disponíveis"}</Text>
              {idea.missingIngredients.length ? (
                <>
                  <Text style={styles.groupLabel}>Se faltar</Text>
                  <Text style={styles.reason}>{idea.missingIngredients.join(", ")}</Text>
                </>
              ) : null}
              <Text style={styles.groupLabel}>Como preparar</Text>
              {idea.prepSteps.map((step) => <Text key={step} style={styles.reason}>{step}</Text>)}
            </View>
          </Card>
        ))}

        <SelectionGroup
          label="Filtrar refeições"
          helperText="Escolhe que tipo de refeições queres ver nesta lista."
          options={filters}
          selectedValue={filter}
          onChange={(value) => setFilter(value as Filter)}
        />

        {meals.isLoading ? <LoadingSkeleton lines={5} /> : null}
        {meals.isError ? <EmptyState title="Nao consegui carregar as refeicoes." body="Confirma a API e tenta novamente." actionLabel="Tentar novamente" onRetry={() => meals.refetch()} /> : null}
        {!meals.isLoading && !meals.isError && meals.data?.meals.length === 0 ? (
          <EmptyState title="Sem refeicoes neste filtro." body="Muda o filtro ou adiciona esta refeicao na seed/API quando quiseres expandir a pool." />
        ) : null}

        {meals.data?.meals.map((meal) => (
          <Card key={meal.id}>
            <View style={styles.mealHeader}>
              <View style={styles.mealText}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMeta}>{meal.caloriesEstimate} kcal · {meal.proteinEstimate}g proteina · {meal.dna.volume}</Text>
              </View>
              <View style={styles.badges}>
                {meal.isFavorite ? <Badge label="favorita" tone="gold" /> : null}
                {meal.isSafeMeal ? <Badge label="safe" tone="sage" /> : null}
                {meal.pausedUntil ? <Badge label="pausa" tone="coral" /> : null}
              </View>
            </View>
            <Text style={styles.reason}>{meal.pauseReason ?? (meal.dna.dominantFlavors.join(", ") || "Opcao disponivel para sugestoes futuras.")}</Text>
            <Text style={styles.groupLabel}>Preferências da refeição</Text>
            <View style={styles.actions}>
              <PrimaryButton label={meal.isFavorite ? "Remover favorita" : "Favorita"} variant="soft" onPress={() => favorite.mutate({ id: meal.id, enabled: !meal.isFavorite })} disabled={favorite.isPending} />
              <PrimaryButton label={meal.isSafeMeal ? "Remover safe" : "Safe meal"} variant="soft" onPress={() => safe.mutate({ id: meal.id, enabled: !meal.isSafeMeal })} disabled={safe.isPending} />
            </View>
          </Card>
        ))}

        <Card tone="warm">
          <SectionTitle>Adicionar refeicao</SectionTitle>
          <Text style={styles.reason}>A API ja suporta criar refeicoes manuais. O formulario completo fica para a proxima iteracao para nao criar dados incompletos por acidente.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Tudo" },
  { value: "breakfast", label: "Peq.-almoco" },
  { value: "lunch", label: "Almoco" },
  { value: "snack", label: "Lanche" },
  { value: "dinner", label: "Jantar" },
  { value: "low", label: "Baixo volume" },
  { value: "creamy", label: "Cremoso" },
  { value: "liquid", label: "Liquido" },
  { value: "favorite", label: "Favoritas" },
  { value: "safe", label: "Safe" },
  { value: "paused", label: "Pausa" }
];

function filterToQuery(filter: Filter) {
  if (filter === "all") return {};
  if (filter === "low") return { volume: "low" };
  if (filter === "creamy" || filter === "liquid") return { texture: filter };
  if (filter === "favorite") return { favorite: true };
  if (filter === "safe") return { safe: true };
  if (filter === "paused") return { paused: true };
  return { mealTime: filter };
}

function toPantryItems(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name, category: inferCategory(name), available: true }));
}

function inferCategory(name: string) {
  const lower = name.toLowerCase();
  if (["frango", "peru", "ovos", "whey", "iogurte", "atum", "carne", "peixe"].some((item) => lower.includes(item))) return "protein";
  if (["arroz", "massa", "aveia", "pao", "wrap", "batata", "banana"].some((item) => lower.includes(item))) return "carbs";
  if (["azeite", "manteiga", "frutos secos", "amendoim"].some((item) => lower.includes(item))) return "fat";
  return "other";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.lg, padding: spacing.lg },
  header: { gap: spacing.sm },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  mealHeader: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  mealText: { flex: 1, gap: spacing.xs },
  mealName: { color: colors.ink, fontSize: 17, fontWeight: "800", lineHeight: 23 },
  mealMeta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  badges: { alignItems: "flex-end", gap: spacing.xs },
  reason: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  groupLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  input: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: spacing.md },
  textArea: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 96, padding: spacing.md, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  aiState: { gap: spacing.sm },
  aiList: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  actions: { gap: spacing.sm }
});
