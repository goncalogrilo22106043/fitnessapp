import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingInput, saveOnboarding } from "../features/onboarding/onboardingApi";
import { completeRoutineProfile, saveOnboardingProgress, saveRoutineConsent, saveRoutineProfile } from "../features/routine/routineProfileApi";
import { Badge, Card, Metric, ProgressBar, PrimaryButton, SectionTitle, SelectionGroup } from "../ui/components";
import { colors, radius, shadows, spacing, typography } from "../ui/theme";

const days = [
  ["monday", "Seg"],
  ["tuesday", "Ter"],
  ["wednesday", "Qua"],
  ["thursday", "Qui"],
  ["friday", "Sex"],
  ["saturday", "Sab"],
  ["sunday", "Dom"]
] as const;

const dayOptions = days.map(([value, label]) => ({ value, label }));

const initialInput: OnboardingInput = {
  basic: {
    name: "Goncalo",
    sex: "male",
    age: 21,
    heightCentimeters: 171,
    weightKilograms: 64,
    targetWeightKilograms: 70,
    desiredPace: "normal"
  },
  bodyGoal: "lean_gain",
  dailyRoutine: {
    wakeTime: "07:30",
    sleepTime: "23:30",
    workType: "mixed",
    hardEatingDays: ["monday", "thursday"],
    weekendWakeTime: "09:30",
    weekendBedTime: "00:30",
    workStartTime: "09:00",
    workEndTime: "17:30",
    workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    canEatAtWork: true,
    accessToKitchenAtWork: false,
    commuteDurationMinutes: 20,
    commuteType: "car"
  },
  mealSchedule: {
    breakfastTime: "08:30",
    morningSnackTime: "",
    lunchTime: "13:00",
    afternoonSnackTime: "16:30",
    dinnerTime: "20:30",
    supperTime: "",
    mealsUsuallySkipped: ["breakfast"],
    mealsHardestToFinish: ["breakfast"],
    weekendMealTimesDifferent: false
  },
  trainingRoutine: {
    trainingDaysPerWeek: 6,
    trainingType: "musculacao",
    preferredTimes: ["evening"],
    trainingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    trainingTime: "18:00",
    trainingIntensity: "high",
    restDays: ["sunday"],
    durationMinutes: 75,
    location: "gym",
    preWorkoutMealLeadMinutes: 90,
    postWorkoutMealWindowMinutes: 120,
    appetiteAfterTraining: "medium"
  },
  appetiteProfile: {
    bestAppetiteTime: "18:00",
    worstAppetiteTime: "08:00",
    appetiteMorning: "low",
    appetiteLunch: "medium",
    appetiteAfternoon: "medium",
    appetiteDinner: "medium",
    appetiteNight: "medium",
    volumeTolerance: "low",
    eatingSpeed: "slow",
    needsLongMealTime: true,
    preferredMealTemperature: "varies"
  },
  toleranceProfile: {
    preferredTextures: { creamy: 0.95, soft: 0.85, liquid: 0.8, dry: 0.15, crunchy: 0.35 },
    preferredVolumes: { low: 0.95, medium: 0.55, high: 0.12 },
    avoidedTextures: ["dry"],
    preferredTextureStyle: "mixed",
    nauseaFoods: ["frango seco", "arroz seco"],
    safeFoods: ["iogurte", "wrap", "smoothie"]
  },
  foodPreferences: {
    preferredFlavors: { doce: 0.9, suave: 0.8, fresco: 0.75 },
    avoidedIngredients: ["seco"],
    safeMealIds: [],
    favoriteMealIds: [],
    favoriteFoods: ["aveia", "frutos vermelhos", "wraps"],
    dislikedFoods: ["comida seca"],
    allergies: [],
    intolerances: [],
    dietType: "omnivore"
  },
  budgetProfile: { level: "medium", maxCookingMinutes: 20, weekendCookingMinutes: 35, cookingSkill: "basic", batchCookingAvailable: false },
  behaviorProfile: {
    motivation: "ganhar peso sem sentir que estou sempre a forçar comida",
    mainDifficulty: "volume excessivo",
    typicalReasonForSkippingMeals: "falta de fome",
    wantsReminders: true,
    preferredTone: "calm"
  },
  consent: {
    aiPersonalizationConsent: false,
    dataProcessingConsent: true
  },
  eatingMode: "easy_bulking",
  mealTimes: ["breakfast", "lunch", "snack", "dinner"]
};

const stepTitles = [
  "Comecar",
  "Corpo",
  "Objetivo",
  "Sono",
  "Trabalho",
  "Treino",
  "Dias",
  "Apetite",
  "Volume",
  "Texturas",
  "Seguros",
  "Gostos",
  "Cozinha",
  "Modo e AI",
  "Metas",
  "Pronto"
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [input, setInput] = useState(initialInput);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof saveOnboarding>>["nutrition"] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const preview = useMemo(() => calculatePreview(input), [input]);
  const progress = ((step + 1) / stepTitles.length) * 100;

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await saveRoutineProfile(input);
      await saveRoutineConsent(input.consent ?? { aiPersonalizationConsent: false, dataProcessingConsent: true });
      const response = await saveOnboarding(input);
      await completeRoutineProfile();
      setResult(response.nutrition);
      setStep(stepTitles.length - 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao consegui criar o perfil. Tenta novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function persistProgress(nextStep: number) {
    setIsSavingProgress(true);
    setProgressMessage(null);

    try {
      await saveOnboardingProgress({
        currentStep: stepTitles[nextStep] ?? "Pronto",
        completedSteps: stepTitles.slice(0, Math.max(nextStep, 0)),
        draftData: input
      });
    } catch {
      setProgressMessage("Nao consegui guardar este passo agora, mas podes continuar.");
    } finally {
      setIsSavingProgress(false);
    }
  }

  async function goBack() {
    const nextStep = Math.max(step - 1, 0);
    await persistProgress(nextStep);
    setStep(nextStep);
  }

  async function next() {
    const saveStep = stepTitles.length - 2;

    if (step < saveStep) {
      const nextStep = step + 1;
      await persistProgress(nextStep);
      setStep(nextStep);
      return;
    }

    if (!result) {
      void handleSave();
      return;
    }

    const finalStep = stepTitles.length - 1;
    await persistProgress(finalStep);
    setStep(finalStep);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>ROTINA</Text>
            <Text style={styles.stepName}>{stepTitles[step]}</Text>
          </View>
          <Badge label={`${step + 1}/${stepTitles.length}`} tone="sage" />
        </View>
        <ProgressBar value={progress} tone="sage" />

        {renderStep({ step, input, setInput, preview, result })}

        {errorMessage ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Nao consegui guardar o perfil</Text>
            <Text style={styles.errorBody}>{errorMessage}</Text>
          </View>
        ) : null}

        {progressMessage ? (
          <View style={styles.progressPanel}>
            <Text style={styles.progressText}>{progressMessage}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {step > 0 ? <PrimaryButton label="Voltar" onPress={() => void goBack()} variant="outline" disabled={isSaving || isSavingProgress} /> : null}
          <PrimaryButton
            label={buttonLabel(step, result, isSaving, isSavingProgress)}
            onPress={step === stepTitles.length - 1 ? onDone : () => void next()}
            disabled={isSaving || isSavingProgress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function buttonLabel(
  step: number,
  result: Awaited<ReturnType<typeof saveOnboarding>>["nutrition"] | null,
  isSaving: boolean,
  isSavingProgress: boolean
) {
  if (isSavingProgress) return "A guardar...";
  if (step === stepTitles.length - 1) return "Entrar na app";
  if (step === stepTitles.length - 2 && !result) return isSaving ? "A criar..." : "Criar plano adaptativo";
  return "Continuar";
}

function renderStep({
  step,
  input,
  setInput,
  preview,
  result
}: {
  step: number;
  input: OnboardingInput;
  setInput: (value: OnboardingInput) => void;
  preview: ReturnType<typeof calculatePreview>;
  result: Awaited<ReturnType<typeof saveOnboarding>>["nutrition"] | null;
}) {
  if (step === 0) {
    return (
      <View style={styles.hero}>
        <Text style={styles.title}>Vamos criar um plano que aprende contigo.</Text>
        <Text style={styles.subtitle}>Responde por partes. Cada passo tem só uma ideia principal, e podes ajustar tudo depois.</Text>
        <Card tone="dark">
          <Text style={styles.darkTitle}>Como vai funcionar</Text>
          <Text style={styles.darkBody}>A app guarda o teu perfil, cria metas iniciais e melhora as refeições com o feedback que deres no dia a dia.</Text>
        </Card>
      </View>
    );
  }

  if (step === 1) {
    return (
      <Section title="Dados básicos" body="Só o essencial para calcular uma primeira meta diária.">
        <TextField label="Nome" value={input.basic.name ?? ""} onChange={(name) => setInput({ ...input, basic: { ...input.basic, name } })} />
        <View style={styles.gridTwo}>
          <NumberField label="Idade" value={input.basic.age} onChange={(age) => setInput({ ...input, basic: { ...input.basic, age } })} />
          <NumberField label="Altura cm" value={input.basic.heightCentimeters} onChange={(heightCentimeters) => setInput({ ...input, basic: { ...input.basic, heightCentimeters } })} />
          <NumberField label="Peso atual" value={input.basic.weightKilograms} onChange={(weightKilograms) => setInput({ ...input, basic: { ...input.basic, weightKilograms } })} />
          <NumberField label="Peso objetivo" value={input.basic.targetWeightKilograms ?? 70} onChange={(targetWeightKilograms) => setInput({ ...input, basic: { ...input.basic, targetWeightKilograms } })} />
        </View>
      </Section>
    );
  }

  if (step === 2) {
    return (
      <Section title="Objetivo corporal" body="Escolhe a direção. A app depois ajusta o ritmo com o teu feedback real.">
        <SelectionGroup
          label="Objetivo"
          options={[{ value: "lean_gain", label: "Ganhar" }, { value: "maintenance", label: "Manter" }, { value: "fat_loss", label: "Perder" }]}
          selectedValue={input.bodyGoal}
          onChange={(bodyGoal) => setInput({ ...input, bodyGoal: bodyGoal as OnboardingInput["bodyGoal"] })}
        />
        <SelectionGroup
          label="Ritmo do plano"
          options={[{ value: "calm", label: "Calmo" }, { value: "normal", label: "Normal" }, { value: "aggressive", label: "Agressivo" }]}
          selectedValue={input.basic.desiredPace}
          onChange={(desiredPace) => setInput({ ...input, basic: { ...input.basic, desiredPace: desiredPace as OnboardingInput["basic"]["desiredPace"] } })}
        />
        <Card tone="warm">
          <Text style={styles.inlineTitle}>O que isto muda?</Text>
          <Text style={styles.helper}>O objetivo define calorias. O ritmo define o quão agressivo é o ajuste. Se tiveres dificuldade em comer, “Calmo” ou “Normal” costuma ser melhor.</Text>
        </Card>
      </Section>
    );
  }

  if (step === 3) {
    return (
      <Section title="Horários do teu dia" body="Isto ajuda a posicionar refeições nos momentos em que tens mais margem.">
        <View style={styles.gridTwo}>
          <TextField label="Acordar" value={input.dailyRoutine?.wakeTime ?? ""} onChange={(wakeTime) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, wakeTime } })} />
          <TextField label="Dormir" value={input.dailyRoutine?.sleepTime ?? ""} onChange={(sleepTime) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, sleepTime } })} />
          <TextField label="Acordar fim de semana" value={input.dailyRoutine?.weekendWakeTime ?? ""} onChange={(weekendWakeTime) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, weekendWakeTime } })} />
          <TextField label="Dormir fim de semana" value={input.dailyRoutine?.weekendBedTime ?? ""} onChange={(weekendBedTime) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, weekendBedTime } })} />
        </View>
        <View style={styles.gridTwo}>
          <TextField label="Início trabalho/aulas" value={input.dailyRoutine?.workStartTime ?? ""} onChange={(workStartTime) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, workStartTime } })} />
          <TextField label="Fim trabalho/aulas" value={input.dailyRoutine?.workEndTime ?? ""} onChange={(workEndTime) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, workEndTime } })} />
        </View>
        <SelectionGroup
          label="Tipo de trabalho"
          options={[{ value: "seated", label: "Sentado" }, { value: "mixed", label: "Misto" }, { value: "active", label: "Ativo" }]}
          selectedValue={input.dailyRoutine?.workType ?? "mixed"}
          onChange={(workType) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, workType: workType as "seated" | "mixed" | "active" } })}
        />
      </Section>
    );
  }

  if (step === 4) {
    return (
      <Section title="Estrutura alimentar" body="Diz-nos quando costumas comer e que refeições são mais difíceis.">
        <View style={styles.gridTwo}>
          <TextField label="Pequeno-almoço" value={input.mealSchedule?.breakfastTime ?? ""} onChange={(breakfastTime) => setInput({ ...input, mealSchedule: { ...input.mealSchedule!, breakfastTime } })} />
          <TextField label="Almoço" value={input.mealSchedule?.lunchTime ?? ""} onChange={(lunchTime) => setInput({ ...input, mealSchedule: { ...input.mealSchedule!, lunchTime } })} />
          <TextField label="Lanche" value={input.mealSchedule?.afternoonSnackTime ?? ""} onChange={(afternoonSnackTime) => setInput({ ...input, mealSchedule: { ...input.mealSchedule!, afternoonSnackTime } })} />
          <TextField label="Jantar" value={input.mealSchedule?.dinnerTime ?? ""} onChange={(dinnerTime) => setInput({ ...input, mealSchedule: { ...input.mealSchedule!, dinnerTime } })} />
        </View>
        <SelectionGroup
          label="Refeições que costumas saltar"
          helperText="Isto ajuda a app a não insistir onde normalmente falha."
          options={[{ value: "breakfast", label: "Pequeno-almoço" }, { value: "lunch", label: "Almoço" }, { value: "snack", label: "Lanche" }, { value: "dinner", label: "Jantar" }]}
          selectedValues={input.mealSchedule?.mealsUsuallySkipped ?? []}
          multiSelect
          onChange={(mealsUsuallySkipped) => setInput({ ...input, mealSchedule: { ...input.mealSchedule!, mealsUsuallySkipped: mealsUsuallySkipped as string[] } })}
        />
        <SelectionGroup
          label="Refeições mais difíceis de acabar"
          options={[{ value: "breakfast", label: "Pequeno-almoço" }, { value: "lunch", label: "Almoço" }, { value: "snack", label: "Lanche" }, { value: "dinner", label: "Jantar" }]}
          selectedValues={input.mealSchedule?.mealsHardestToFinish ?? []}
          multiSelect
          onChange={(mealsHardestToFinish) => setInput({ ...input, mealSchedule: { ...input.mealSchedule!, mealsHardestToFinish: mealsHardestToFinish as string[] } })}
        />
        <SelectionGroup
          label="Dias mais difíceis para comer"
          helperText="Podes escolher vários ou deixar vazio."
          options={dayOptions}
          selectedValues={input.dailyRoutine?.hardEatingDays ?? []}
          multiSelect
          onChange={(hardEatingDays) => setInput({ ...input, dailyRoutine: { ...input.dailyRoutine!, hardEatingDays: hardEatingDays as string[] } })}
        />
      </Section>
    );
  }

  if (step === 5) {
    return (
      <Section title="Treino" body="Primeiro o padrão geral. Não precisa de estar perfeito.">
        <NumberField label="Treinos por semana" value={input.trainingRoutine.trainingDaysPerWeek} onChange={(trainingDaysPerWeek) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, trainingDaysPerWeek } })} />
        <TextField label="Tipo de treino" value={input.trainingRoutine.trainingType} onChange={(trainingType) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, trainingType } })} />
        <TextField label="Horario habitual" value={input.trainingRoutine.trainingTime ?? ""} onChange={(trainingTime) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, trainingTime } })} />
        <View style={styles.gridTwo}>
          <NumberField label="Duração min" value={input.trainingRoutine.durationMinutes ?? 60} onChange={(durationMinutes) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, durationMinutes } })} />
          <TextField label="Local" value={input.trainingRoutine.location ?? ""} onChange={(location) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, location } })} />
        </View>
        <SelectionGroup
          label="Intensidade"
          options={[{ value: "low", label: "Leve" }, { value: "moderate", label: "Média" }, { value: "high", label: "Alta" }]}
          selectedValue={input.trainingRoutine.trainingIntensity}
          onChange={(trainingIntensity) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, trainingIntensity: trainingIntensity as OnboardingInput["trainingRoutine"]["trainingIntensity"] } })}
        />
      </Section>
    );
  }

  if (step === 6) {
    return (
      <Section title="Dias de treino" body="Isto ajuda a app a distribuir melhor energia durante a semana.">
        <SelectionGroup
          label="Dias de treino"
          options={dayOptions}
          selectedValues={input.trainingRoutine.trainingDays}
          multiSelect
          onChange={(values) => {
            const trainingDays = values as string[];
            setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, trainingDays, trainingDaysPerWeek: trainingDays.length, restDays: days.map(([value]) => value).filter((day) => !trainingDays.includes(day)) } });
          }}
        />
      </Section>
    );
  }

  if (step === 7) {
    return (
      <Section title="Apetite ao longo do dia" body="Queremos perceber quando comer é mais fácil e quando custa mais.">
        <View style={styles.gridTwo}>
          <TextField label="Mais apetite" value={input.appetiteProfile?.bestAppetiteTime ?? ""} onChange={(bestAppetiteTime) => setInput({ ...input, appetiteProfile: { ...input.appetiteProfile!, bestAppetiteTime } })} />
          <TextField label="Menos apetite" value={input.appetiteProfile?.worstAppetiteTime ?? ""} onChange={(worstAppetiteTime) => setInput({ ...input, appetiteProfile: { ...input.appetiteProfile!, worstAppetiteTime } })} />
        </View>
        <SelectionGroup
          label="Apetite ao acordar"
          options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]}
          selectedValue={input.appetiteProfile?.appetiteMorning ?? "medium"}
          onChange={(appetiteMorning) => setInput({ ...input, appetiteProfile: { ...input.appetiteProfile!, appetiteMorning: appetiteMorning as "low" | "medium" | "high" } })}
        />
        <SelectionGroup
          label="Apetite à noite"
          options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]}
          selectedValue={input.appetiteProfile?.appetiteNight ?? "medium"}
          onChange={(appetiteNight) => setInput({ ...input, appetiteProfile: { ...input.appetiteProfile!, appetiteNight: appetiteNight as "low" | "medium" | "high" } })}
        />
        <SelectionGroup
          label="Apetite depois do treino"
          options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]}
          selectedValue={input.trainingRoutine.appetiteAfterTraining ?? "medium"}
          onChange={(appetiteAfterTraining) => setInput({ ...input, trainingRoutine: { ...input.trainingRoutine, appetiteAfterTraining: appetiteAfterTraining as "low" | "medium" | "high" } })}
        />
      </Section>
    );
  }

  if (step === 8) {
    return (
      <Section title="Volume alimentar" body="Isto é importante se tens dificuldade em comer muito de uma vez.">
        <SelectionGroup
          label="Tolerância a volume"
          options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]}
          selectedValue={input.appetiteProfile?.volumeTolerance ?? "medium"}
          onChange={(volumeTolerance) => setInput({ ...input, appetiteProfile: { ...input.appetiteProfile!, volumeTolerance: volumeTolerance as "low" | "medium" | "high" }, toleranceProfile: { ...input.toleranceProfile, preferredVolumes: volumeProfile(volumeTolerance as string) } })}
        />
        <Card tone="warm">
          <Text style={styles.inlineTitle}>Exemplo</Text>
          <Text style={styles.helper}>Se escolheres “Baixo”, a app tenta usar opções mais densas em calorias e menos gigantes no prato.</Text>
        </Card>
      </Section>
    );
  }

  if (step === 9) {
    return (
      <Section title="Texturas" body="Marca texturas que normalmente te fazem desistir de uma refeição.">
        <SelectionGroup
          label="Texturas que costumas evitar"
          options={[{ value: "dry", label: "Seco" }, { value: "thick", label: "Espesso" }, { value: "dense", label: "Denso" }, { value: "liquid", label: "Líquido" }, { value: "hot", label: "Quente" }, { value: "cold", label: "Frio" }, { value: "crunchy", label: "Crocante" }]}
          selectedValues={input.toleranceProfile.avoidedTextures}
          multiSelect
          onChange={(avoidedTextures) => setInput({ ...input, toleranceProfile: { ...input.toleranceProfile, avoidedTextures: avoidedTextures as string[], preferredTextures: textureProfile(avoidedTextures as string[]) } })}
        />
        <SelectionGroup
          label="Como preferes o prato?"
          options={[{ value: "mixed", label: "Misturado" }, { value: "separate", label: "Separado" }]}
          selectedValue={input.toleranceProfile.preferredTextureStyle}
          onChange={(preferredTextureStyle) => setInput({ ...input, toleranceProfile: { ...input.toleranceProfile, preferredTextureStyle: preferredTextureStyle as "mixed" | "separate" } })}
        />
      </Section>
    );
  }

  if (step === 10) {
    return (
      <Section title="Alimentos seguros e enjoo" body="Aqui podes escrever pouco. A app usa isto para saber o que costuma funcionar contigo.">
        <TextField label="Alimentos que causaram enjoo" helper="Separa por vírgulas. Ex: frango seco, arroz seco" value={input.toleranceProfile.nauseaFoods.join(", ")} onChange={(text) => setInput({ ...input, toleranceProfile: { ...input.toleranceProfile, nauseaFoods: toList(text) } })} />
        <TextField label="Alimentos seguros" helper="Coisas que normalmente consegues comer sem stress." value={input.toleranceProfile.safeFoods.join(", ")} onChange={(text) => setInput({ ...input, toleranceProfile: { ...input.toleranceProfile, safeFoods: toList(text) } })} />
      </Section>
    );
  }

  if (step === 11) {
    return (
      <Section title="Gostos alimentares" body="Isto evita planos genéricos. Diz à app o que gostas e o que queres evitar.">
        <SelectionGroup
          label="Preferência de manhã"
          options={[{ value: "doce", label: "Doce" }, { value: "salgado", label: "Salgado" }, { value: "suave", label: "Suave" }]}
          selectedValue={mainFlavor(input)}
          onChange={(flavor) => setInput({ ...input, foodPreferences: { ...input.foodPreferences, preferredFlavors: { [flavor as string]: 0.95 } } })}
        />
        <TextField label="Favoritos" helper="Ex: wraps, iogurte, smoothies" value={input.foodPreferences.favoriteFoods.join(", ")} onChange={(text) => setInput({ ...input, foodPreferences: { ...input.foodPreferences, favoriteFoods: toList(text) } })} />
        <TextField label="Nao gosto" helper="Ex: aveia, atum, comida seca" value={input.foodPreferences.dislikedFoods.join(", ")} onChange={(text) => setInput({ ...input, foodPreferences: { ...input.foodPreferences, dislikedFoods: toList(text), avoidedIngredients: toList(text) } })} />
        <TextField label="Alergias" helper="Deixa vazio se não tiveres." value={input.foodPreferences.allergies.join(", ")} onChange={(text) => setInput({ ...input, foodPreferences: { ...input.foodPreferences, allergies: toList(text) } })} />
      </Section>
    );
  }

  if (step === 12) {
    return (
      <Section title="Alimentação e orçamento" body="Só para manter sugestões realistas para o teu dia e para a tua cozinha.">
        <SelectionGroup
          label="Tipo de alimentação"
          options={[{ value: "omnivore", label: "Omnívora" }, { value: "vegetarian", label: "Vegetariana" }, { value: "vegan", label: "Vegan" }, { value: "other", label: "Outra" }]}
          selectedValue={input.foodPreferences.dietType}
          onChange={(dietType) => setInput({ ...input, foodPreferences: { ...input.foodPreferences, dietType: dietType as OnboardingInput["foodPreferences"]["dietType"] } })}
        />
        <View style={styles.gridTwo}>
          <NumberField label="Minutos cozinha" value={input.budgetProfile.maxCookingMinutes} onChange={(maxCookingMinutes) => setInput({ ...input, budgetProfile: { ...input.budgetProfile, maxCookingMinutes } })} />
          <NumberField label="Minutos fim de semana" value={input.budgetProfile.weekendCookingMinutes ?? 30} onChange={(weekendCookingMinutes) => setInput({ ...input, budgetProfile: { ...input.budgetProfile, weekendCookingMinutes } })} />
        </View>
        <SelectionGroup
          label="Nível na cozinha"
          options={[{ value: "basic", label: "Básico" }, { value: "normal", label: "Normal" }, { value: "advanced", label: "Avançado" }]}
          selectedValue={input.budgetProfile.cookingSkill ?? "basic"}
          onChange={(cookingSkill) => setInput({ ...input, budgetProfile: { ...input.budgetProfile, cookingSkill: cookingSkill as "basic" | "normal" | "advanced" } })}
        />
        <SelectionGroup
          label="Consegues preparar comida para vários dias?"
          options={[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }]}
          selectedValue={input.budgetProfile.batchCookingAvailable ? "yes" : "no"}
          onChange={(value) => setInput({ ...input, budgetProfile: { ...input.budgetProfile, batchCookingAvailable: value === "yes" } })}
        />
        <SelectionGroup
          label="Orçamento"
          options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]}
          selectedValue={input.budgetProfile.level}
          onChange={(level) => setInput({ ...input, budgetProfile: { ...input.budgetProfile, level: level as OnboardingInput["budgetProfile"]["level"] } })}
        />
      </Section>
    );
  }

  if (step === 13) {
    return (
      <Section title="Modo de plano e AI" body="Escolhe a personalidade do plano e se queres usar AI para personalizar explicações e estrutura diária.">
        <Text style={styles.groupLabel}>Modo de plano</Text>
        <ModeCard title="Bulking Facil" active={input.eatingMode === "easy_bulking"} body="Mais smoothies, wraps, granola, leite, frutos secos e calorias faceis." onPress={() => setInput({ ...input, eatingMode: "easy_bulking" })} />
        <ModeCard title="Bulking Limpo" active={input.eatingMode === "clean_bulking"} body="Mais arroz, batata, aveia, ovos, carne, peixe e fruta." onPress={() => setInput({ ...input, eatingMode: "clean_bulking" })} />
        <ModeCard title="Equilibrado" active={input.eatingMode === "balanced"} body="Um meio termo: simples, flexivel e sem extremos." onPress={() => setInput({ ...input, eatingMode: "balanced" })} />
        <SelectionGroup
          label="Personalização com AI"
          helperText="Se aceitares, a API pode enviar dados mínimos da rotina para gerar análise e explicações. A chave da OpenAI nunca fica no telemóvel."
          options={[{ value: "yes", label: "Aceito" }, { value: "no", label: "Sem AI" }]}
          selectedValue={input.consent?.aiPersonalizationConsent ? "yes" : "no"}
          onChange={(value) => setInput({ ...input, consent: { dataProcessingConsent: true, aiPersonalizationConsent: value === "yes" } })}
        />
      </Section>
    );
  }

  if (step === 14) {
    const numbers = result ?? preview;
    return (
      <Section title="Metas iniciais" body="Estes números são só o ponto de partida. A app ajusta com o teu feedback real.">
        <View style={styles.metrics}>
          <Metric label="BMR" value={`${numbers.bmr}`} />
          <Metric label="TDEE" value={`${numbers.tdee}`} tone="blue" />
          <Metric label="Kcal" value={`${numbers.targets.calories}`} tone="gold" />
          <Metric label="Proteina" value={`${numbers.targets.proteinGrams}g`} tone="sage" />
          <Metric label="Hidratos" value={`${numbers.targets.carbsGrams}g`} tone="blue" />
          <Metric label="Gordura" value={`${numbers.targets.fatGrams}g`} tone="coral" />
        </View>
      </Section>
    );
  }

  return (
    <Section title="Perfil pronto" body="Já tenho informação suficiente para criar as primeiras refeições e começar a aprender contigo.">
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Padrao</Text><Text style={styles.summaryValue}>{input.appetiteProfile?.appetiteMorning === "low" ? "manhas leves" : "apetite regular"}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Texturas</Text><Text style={styles.summaryValue}>{input.toleranceProfile.avoidedTextures.join(", ") || "sem bloqueios"}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Safe foods</Text><Text style={styles.summaryValue}>{input.toleranceProfile.safeFoods.join(", ") || "por definir"}</Text></View>
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Modo</Text><Text style={styles.summaryValue}>{modeLabel(input.eatingMode)}</Text></View>
    </Section>
  );
}

function Section({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <Text style={styles.helper}>{body}</Text>
      {children}
    </Card>
  );
}

function TextField({ label, helper, value, onChange }: { label: string; helper?: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholderTextColor={colors.subtle} />
    </View>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={String(value)} keyboardType="number-pad" onChangeText={(text) => onChange(Number(text) || 0)} />
    </View>
  );
}

function ModeCard({ title, body, active, onPress }: { title: string; body: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.modeCard, active && styles.modeActive]} onPress={onPress}>
      <Text style={[styles.modeTitle, active && styles.modeTextActive]}>{title}</Text>
      <Text style={[styles.modeBody, active && styles.modeTextActive]}>{body}</Text>
    </Pressable>
  );
}

function calculatePreview(input: OnboardingInput) {
  const sexConstant = input.basic.sex === "male" ? 5 : -161;
  const bmr = Math.round(10 * input.basic.weightKilograms + 6.25 * input.basic.heightCentimeters - 5 * input.basic.age + sexConstant);
  const multiplier = input.trainingRoutine.trainingDaysPerWeek >= 5 ? 1.62 : input.trainingRoutine.trainingDaysPerWeek >= 3 ? 1.45 : 1.32;
  const tdee = Math.round(bmr * multiplier);
  const modeDelta = input.eatingMode === "easy_bulking" ? 150 : input.eatingMode === "balanced" ? 75 : 0;
  const calories = tdee + (input.bodyGoal === "lean_gain" ? 250 : input.bodyGoal === "fat_loss" ? -350 : 0) + modeDelta;
  const proteinGrams = Math.round(input.basic.weightKilograms * 2);
  const fatGrams = Math.round(input.basic.weightKilograms * 0.8);
  const carbsGrams = Math.max(Math.round((calories - proteinGrams * 4 - fatGrams * 9) / 4), 0);
  return { bmr, tdee, targets: { calories, proteinGrams, carbsGrams, fatGrams } };
}

function toList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function volumeProfile(value: string) {
  return value === "low" ? { low: 0.95, medium: 0.55, high: 0.12 } : value === "high" ? { low: 0.55, medium: 0.78, high: 0.9 } : { low: 0.75, medium: 0.85, high: 0.45 };
}

function textureProfile(avoided: string[]) {
  return {
    creamy: avoided.includes("thick") ? 0.55 : 0.92,
    soft: 0.85,
    liquid: avoided.includes("liquid") ? 0.2 : 0.75,
    dry: avoided.includes("dry") ? 0.12 : 0.65,
    crunchy: avoided.includes("crunchy") ? 0.2 : 0.55,
    mixed: 0.75
  };
}

function mainFlavor(input: OnboardingInput) {
  return Object.entries(input.foodPreferences.preferredFlavors).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "suave";
}

function modeLabel(mode: OnboardingInput["eatingMode"]) {
  if (mode === "easy_bulking") return "Bulking Facil";
  if (mode === "balanced") return "Equilibrado";
  return "Bulking Limpo";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.lg, padding: spacing.lg },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brand: { color: colors.sage, fontSize: 14, fontWeight: "800", letterSpacing: 0 },
  stepName: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: spacing.xs },
  hero: { gap: spacing.lg, paddingTop: spacing.md },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  darkTitle: { color: colors.surface, fontSize: 22, fontWeight: "800" },
  darkBody: { color: "#DDE4DC", fontSize: 15, lineHeight: 22 },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  inlineTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  groupLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  gridTwo: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  field: { flexGrow: 1, flexBasis: "46%", gap: spacing.xs },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  fieldHelper: { color: colors.subtle, fontSize: 12, lineHeight: 16 },
  input: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.md },
  modeCard: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  modeActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  modeTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  modeBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  modeTextActive: { color: colors.surface },
  summaryRow: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  summaryValue: { color: colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  errorPanel: { backgroundColor: colors.coralSoft, borderColor: "#E9C7BE", borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  errorTitle: { color: colors.danger, fontSize: 15, fontWeight: "800" },
  errorBody: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  progressPanel: { backgroundColor: colors.backgroundSoft, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  progressText: { color: colors.muted, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  footer: { ...shadows.soft, backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.sm }
});
