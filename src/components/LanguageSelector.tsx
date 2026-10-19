import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { languageOptions } from "../i18n/translate";
import type { AppLanguage } from "../types";
import { useAppTheme } from "../theme";
import { SelectionSheet } from "./SelectionSheet";

export function LanguageSelector() {
  const { colors } = useAppTheme();
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="App language" onPress={() => setOpen(true)}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name="language-outline" size={18} color={colors.inkSoft} />
      <Text localize={false} style={[styles.label, { color: colors.inkSoft }]}>{languageOptions.find(option => option.id === language)?.name}</Text>
      <Ionicons name="chevron-down" size={14} color={colors.inkSoft} />
    </Pressable>
    <SelectionSheet visible={open} title="Language" value={language} options={languageOptions}
      onSelect={value => setLanguage(value as AppLanguage)} onClose={() => setOpen(false)} />
  </View>;
}
const styles = StyleSheet.create({
  container: { alignItems: "flex-end", marginBottom: 24 },
  button: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, minHeight: 44, borderRadius: 24 },
  label: { fontFamily: "BricolageGrotesque_500Medium", fontSize: 13 }
});
