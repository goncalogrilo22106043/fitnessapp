import { PrimaryButton } from "../ui/components";

export function HardDayButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return <PrimaryButton label={loading ? "A adaptar..." : "Hoje nao consigo"} onPress={onPress} variant="coral" disabled={loading} />;
}
