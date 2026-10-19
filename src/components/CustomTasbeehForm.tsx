import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "../i18n/native";
import { localizeDigits, normalizeDigits } from "../i18n/translate";
import { useI18n } from "../i18n/context";
import { createThemedStyles } from "../theme";
import { SheetHeader } from "./SheetHeader";
import { AppButton } from "./ui";

export function CustomTasbeehForm({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, target: number) => void }) {
  const { colors, styles } = useStyles();
  const { language } = useI18n();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    if (!name.trim()) { setError("Enter a name or dhikr for your Tasbeeh."); return; }
    const parsed = Number(normalizeDigits(target));
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99_999) { setError("Enter a target from 1 to 99,999."); return; }
    onAdd(name.trim(), parsed);
    onClose();
  };
  return <>
    <SheetHeader title="Custom Tasbeeh" subtitle="Your dhikr, your own pace." onClose={onClose} />
    <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <Text style={styles.label}>Name or dhikr</Text>
      <TextInput accessibilityLabel="Name or dhikr" placeholder="Give your Tasbeeh a name" maxLength={80} value={name}
        onChangeText={value => { setName(value); setError(null); }} placeholderTextColor={colors.inkSoft} style={styles.input} returnKeyType="next" />
      <Text style={styles.label}>Target count</Text>
      <TextInput accessibilityLabel="Target count" value={localizeDigits(target, language)} keyboardType="number-pad" maxLength={5}
        onChangeText={value => { setTarget(normalizeDigits(value).replace(/[^0-9]/g, "")); setError(null); }} style={styles.input} selectTextOnFocus />
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}><AppButton label="Create Tasbeeh" icon="add" onPress={save} /></View>
    </ScrollView>
  </>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  label: { color: colors.ink, fontSize: 13, fontFamily: "BricolageGrotesque_600SemiBold", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "BricolageGrotesque_500Medium", color: colors.ink, marginBottom: 20, minHeight: 54 },
  error: { color: colors.danger, fontSize: 13, fontFamily: "BricolageGrotesque_400Regular", marginBottom: 16 },
  actions: { paddingTop: 4 }
}));
