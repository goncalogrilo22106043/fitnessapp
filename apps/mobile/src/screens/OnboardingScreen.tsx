import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { OnboardingInput, saveOnboarding } from "../features/onboarding/onboardingApi";
import { colors, spacing } from "../ui/theme";

const initialInput: OnboardingInput = {
  basic: { sex: "male", age: 28, heightCentimeters: 178, weightKilograms: 78 },
  bodyGoal: "lean_gain",
  trainingRoutine: { trainingDaysPerWeek: 4, trainingType: "musculacao", preferredTimes: ["evening"] },
  toleranceProfile: {
    preferredTextures: { creamy: 0.9, soft: 0.8, dry: 0.35 },
    preferredVolumes: { low: 0.9, medium: 0.75, high: 0.35 }
  },
  foodPreferences: { preferredFlavors: { suave: 0.8 }, avoidedIngredients: [], safeMealIds: [], favoriteMealIds: [] },
  budgetProfile: { level: "medium", maxCookingMinutes: 25 },
  eatingMode: "clean_bulking",
  mealTimes: ["breakfast", "lunch", "snack", "dinner"]
};

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState<Awaited<ReturnType<typeof saveOnboarding>>["nutrition"] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await ensureDemoSession();
    const response = await saveOnboarding(input);
    setResult(response.nutrition);
    setIsSaving(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>ROTINA</Text>
        <Text style={styles.title}>Vamos criar uma base alimentar que caiba na tua rotina.</Text>

        <Section title="Dados basicos">
          <NumberField
            label="Idade"
            value={input.basic.age}
            onChange={(age) => setInput({ ...input, basic: { ...input.basic, age } })}
          />
          <NumberField
            label="Altura cm"
            value={input.basic.heightCentimeters}
            onChange={(heightCentimeters) => setInput({ ...input, basic: { ...input.basic, heightCentimeters } })}
          />
          <NumberField
            label="Peso kg"
            value={input.basic.weightKilograms}
            onChange={(weightKilograms) => setInput({ ...input, basic: { ...input.basic, weightKilograms } })}
          />
        </Section>

        <Section title="Objetivo e treino">
          <OptionRow
            options={[
              ["lean_gain", "Ganhar limpo"],
              ["maintenance", "Manter"],
              ["fat_loss", "Reduzir"]
            ]}
            selected={input.bodyGoal}
            onSelect={(bodyGoal) => setInput({ ...input, bodyGoal: bodyGoal as OnboardingInput["bodyGoal"] })}
          />
          <NumberField
            label="Treinos por semana"
            value={input.trainingRoutine.trainingDaysPerWeek}
            onChange={(trainingDaysPerWeek) =>
              setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, trainingDaysPerWeek } })
            }
          />
        </Section>

        <Section title="Texturas e volume">
          <Text style={styles.helper}>Preferencia alta para cremoso/suave e volume baixo/medio.</Text>
          <OptionRow
            options={[
              ["clean_bulking", "Bulking Limpo"],
              ["easy_bulking", "Bulking Facil"]
            ]}
            selected={input.eatingMode}
            onSelect={(eatingMode) => setInput({ ...input, eatingMode: eatingMode as OnboardingInput["eatingMode"] })}
          />
        </Section>

        {result ? (
          <View style={styles.resultPanel}>
            <Text style={styles.sectionTitle}>Calculo transparente</Text>
            <Text style={styles.metricText}>BMR: {result.bmr} kcal</Text>
            <Text style={styles.metricText}>TDEE: {result.tdee} kcal</Text>
            <Text style={styles.metricText}>
              Meta: {result.targets.calories} kcal, {result.targets.proteinGrams}g proteina
            </Text>
          </View>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={result ? onDone : handleSave} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{result ? "Entrar no dia" : isSaving ? "A criar..." : "Criar perfil"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(value)}
        keyboardType="number-pad"
        onChangeText={(text) => onChange(Number(text) || 0)}
      />
    </View>
  );
}

function OptionRow({
  options,
  selected,
  onSelect
}: {
  options: Array<[string, string]>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map(([value, label]) => (
        <Pressable
          key={value}
          style={[styles.option, selected === value && styles.optionSelected]}
          onPress={() => onSelect(value)}
        >
          <Text style={[styles.optionText, selected === value && styles.optionTextSelected]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", lineHeight: 34, letterSpacing: 0 },
  section: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 8, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  input: { borderColor: colors.line, borderRadius: 8, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 46, paddingHorizontal: spacing.md },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: { borderColor: colors.line, borderRadius: 8, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionText: { color: colors.ink, fontWeight: "800" },
  optionTextSelected: { color: colors.surface },
  resultPanel: { backgroundColor: colors.oat, borderRadius: 8, gap: spacing.xs, padding: spacing.md },
  metricText: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  primaryButton: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 8, minHeight: 54, justifyContent: "center" },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: "800" }
});
