import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureDemoSession } from "../features/auth/authApi";
import { OnboardingInput, saveOnboarding } from "../features/onboarding/onboardingApi";
import { Card, Metric, ProgressBar, PrimaryButton } from "../ui/components";
import { colors, radius, shadows, spacing, typography } from "../ui/theme";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await ensureDemoSession();
      const response = await saveOnboarding(input);
      setResult(response.nutrition);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não consegui criar o perfil. Tenta novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.brand}>ROTINA</Text>
          <Text style={styles.title}>Vamos criar uma base alimentar que caiba na tua rotina.</Text>
          <Text style={styles.subtitle}>Responde ao essencial. A app calcula metas e cria os primeiros slots sem tornar isto pesado.</Text>
          <ProgressBar value={result ? 100 : 72} tone={result ? "sage" : "blue"} />
        </View>

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
          <Text style={styles.helper}>Vamos favorecer refeicoes cremosas, suaves e com volume baixo quando o apetite estiver curto.</Text>
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
            <Text style={styles.sectionTitle}>As tuas primeiras metas</Text>
            <View style={styles.resultGrid}>
              <Metric label="BMR" value={`${result.bmr}`} />
              <Metric label="TDEE" value={`${result.tdee}`} tone="blue" />
              <Metric label="Kcal" value={`${result.targets.calories}`} tone="gold" />
              <Metric label="Proteina" value={`${result.targets.proteinGrams}g`} tone="sage" />
            </View>
            <Text style={styles.helper}>Tudo isto pode ser recalculado no perfil quando o peso ou rotina mudarem.</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Não consegui criar o perfil</Text>
            <Text style={styles.errorBody}>{errorMessage}</Text>
            <Text style={styles.errorHint}>Confirma se a API está ativa no Railway e se a app tem o URL certo no ficheiro .env.</Text>
          </View>
        ) : null}

        <PrimaryButton label={result ? "Entrar no dia" : isSaving ? "A criar..." : "Criar perfil"} onPress={result ? onDone : handleSave} disabled={isSaving} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Card>
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
  hero: {
    gap: spacing.md,
    paddingTop: spacing.sm
  },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  input: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.md },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  option: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionText: { color: colors.ink, fontWeight: "800" },
  optionTextSelected: { color: colors.surface },
  resultPanel: { ...shadows.card, backgroundColor: colors.surfaceWarm, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  resultGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  errorPanel: {
    backgroundColor: colors.coralSoft,
    borderColor: "#E9C7BE",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  errorTitle: { color: colors.danger, fontSize: 15, fontWeight: "800" },
  errorBody: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  errorHint: { color: colors.muted, fontSize: 13, lineHeight: 18 }
});
