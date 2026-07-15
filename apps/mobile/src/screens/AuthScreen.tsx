import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginAccount, registerAccount } from "../features/auth/authApi";
import { Card, PrimaryButton, SectionTitle } from "../ui/components";
import { colors, radius, shadows, spacing, typography } from "../ui/theme";

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "register") {
        await registerAccount({ name: name.trim() || "Rotina", email: email.trim(), password });
      } else {
        await loginAccount({ email: email.trim(), password });
      }
      onAuthenticated();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao consegui entrar. Confirma os dados e tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.brand}>ROTINA</Text>
          <Text style={styles.title}>A tua rotina alimentar, guardada na tua conta.</Text>
          <Text style={styles.subtitle}>Cria conta ou entra para manter perfil, plano, feedback, água, peso e preferências sempre contigo.</Text>
        </View>

        <Card>
          <View style={styles.switcher}>
            <TabButton label="Criar conta" active={mode === "register"} onPress={() => setMode("register")} />
            <TabButton label="Entrar" active={mode === "login"} onPress={() => setMode("login")} />
          </View>

          <SectionTitle>{mode === "register" ? "Primeiro acesso" : "Bem-vindo de volta"}</SectionTitle>

          {mode === "register" ? <Field label="Nome" value={name} onChange={setName} placeholder="Ex: Goncalo" /> : null}
          <Field label="Email" value={email} onChange={setEmail} placeholder="o-teu-email@email.com" keyboardType="email-address" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="mínimo 8 caracteres" secureTextEntry />

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={isSubmitting ? "A guardar..." : mode === "register" ? "Criar conta" : "Entrar"}
            onPress={submit}
            disabled={isSubmitting || email.trim().length === 0 || password.length < 8}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secureTextEntry
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        keyboardType={keyboardType}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { gap: spacing.lg, padding: spacing.lg },
  hero: { gap: spacing.sm, paddingTop: spacing.xl },
  brand: { color: colors.sage, fontSize: 13, fontWeight: "900", letterSpacing: 0 },
  title: { ...typography.title, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  switcher: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  activeTab: { ...shadows.soft, backgroundColor: colors.surface },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  activeTabText: { color: colors.ink },
  field: { gap: spacing.xs },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  input: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md
  },
  errorBox: {
    backgroundColor: colors.coralSoft,
    borderColor: "#E9C7BE",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md
  },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: "700", lineHeight: 20 }
});
