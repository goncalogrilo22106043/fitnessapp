import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Card, PrimaryButton, SectionTitle, SelectionGroup } from "../ui/components";
import { colors, radius, spacing } from "../ui/theme";

export function FeedbackPrompt({
  mealName,
  onFeedback
}: {
  mealName: string;
  onFeedback: (input: {
    mood: "loved" | "neutral" | "could_not_finish";
    eatenPercentage: number;
    notes?: string;
    issueTags?: string[];
    dislikedIngredients?: string[];
  }) => void;
}) {
  const [mood, setMood] = useState<"loved" | "neutral" | "could_not_finish">("neutral");
  const [eatenPercentage, setEatenPercentage] = useState(75);
  const [issueTags, setIssueTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [ingredientText, setIngredientText] = useState("");

  return (
    <Card tone="warm">
      <SectionTitle>Como correu?</SectionTitle>
      <Text style={styles.copy}>{mealName}</Text>
      <Text style={styles.copy}>Isto fica guardado no teu historico e ajuda a AI a ajustar as proximas escolhas.</Text>
      <SelectionGroup
        label="Sensação geral"
        options={[{ value: "loved", label: "Correu bem" }, { value: "neutral", label: "Normal" }, { value: "could_not_finish", label: "Custou" }]}
        selectedValue={mood}
        onChange={(value) => setMood(value as typeof mood)}
      />
      <SelectionGroup
        label="Quanto conseguiste comer?"
        options={[{ value: "100", label: "Tudo" }, { value: "75", label: "Quase tudo" }, { value: "50", label: "Metade" }, { value: "25", label: "Pouco" }]}
        selectedValue={String(eatenPercentage)}
        onChange={(value) => setEatenPercentage(Number(value))}
      />
      <SelectionGroup
        label="O que queres que a app aprenda?"
        helperText="Podes escolher mais do que uma opção."
        options={[
          { value: "enjoo", label: "Enjoei" },
          { value: "textura_seca", label: "Muito seco" },
          { value: "demasiado_volume", label: "Muito volume" },
          { value: "sabor", label: "Sabor" },
          { value: "ingrediente", label: "Ingrediente" }
        ]}
        selectedValues={issueTags}
        multiSelect
        onChange={(values) => setIssueTags(values as string[])}
      />
      <View style={styles.field}>
        <Text style={styles.groupLabel}>Foi por causa de algum ingrediente?</Text>
        <TextInput
          style={styles.input}
          value={ingredientText}
          onChangeText={setIngredientText}
          placeholder="Ex: aveia, iogurte, banana"
          placeholderTextColor={colors.subtle}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.groupLabel}>Notas rápidas</Text>
        <TextInput
          multiline
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ex: consegui comer, mas estava seco e fiquei cheio rápido."
          placeholderTextColor={colors.subtle}
        />
      </View>
      <PrimaryButton
        label="Guardar feedback"
        onPress={() => {
          const trimmedNotes = notes.trim();
          onFeedback({
            mood,
            eatenPercentage,
            issueTags,
            ...(trimmedNotes ? { notes: trimmedNotes } : {}),
            dislikedIngredients: toList(ingredientText)
          });
        }}
      />
    </Card>
  );
}

function toList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

const styles = StyleSheet.create({
  copy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  groupLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  field: {
    gap: spacing.xs
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  notes: {
    minHeight: 92,
    textAlignVertical: "top"
  }
});
