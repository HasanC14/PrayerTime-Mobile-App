import { localizeDigits, normalizeDigits } from "../i18n/translate";
import { useI18n } from "../i18n/context";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Pressable, Text, TextInput } from "../i18n/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createThemedStyles, radii, shadows, spacing } from "../theme";
import { BottomSheetModal } from "./BottomSheetModal";
import { AppButton } from "./ui";
import { SheetHeader } from "./SheetHeader";
import { selectionFeedback } from "../utils/feedback";

const PRESETS = [10, 20, 30, 40, 60] as const;

export function AlarmTimingSheet({
  value,
  visible,
  onSave,
  onClose
}: {
  value: number;
  visible: boolean;
  onSave: (value: number) => Promise<void>;
  onClose: () => void;
}) {
  const { styles } = useStyles();
  const { language } = useI18n();
  const insets = useSafeAreaInsets();
  const [minutes, setMinutes] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formSession, setFormSession] = useState({ value, visible });

  if (formSession.value !== value || formSession.visible !== visible) {
    setFormSession({ value, visible });
    if (visible) {
      setMinutes(String(value));
      setError(null);
    }
  }

  const save = async () => {
    const parsed = Number(minutes.trim());
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
      setError("Enter a whole number from 1 to 60 minutes.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(parsed);
      onClose();
    } catch {
      setError("Couldn't save your timing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      closeLabel="Close reminder timing"
      onClose={onClose}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
    >
          <SheetHeader title="Reminder timing" subtitle="Choose how early to be reminded before each prayer period ends." onClose={onClose} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
          <Text style={styles.sectionLabel}>Minutes before the prayer period ends</Text>
          <View style={styles.presets}>
            {PRESETS.map((preset) => {
              const selected = Number(minutes) === preset;
              return (
                <Pressable
                  key={preset}
                  accessibilityRole="radio"
                  accessibilityLabel={`${preset} minutes before prayer ends`}
                  accessibilityState={{ selected, checked: selected }}
                  onPress={() => {
                    selectionFeedback();
                    setMinutes(String(preset));
                    setError(null);
                  }}
                  style={({ pressed }) => [
                    styles.preset,
                    selected && styles.presetSelected,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.presetText, selected && styles.presetTextSelected]}>{preset}m</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Custom time</Text>
          <View style={[styles.inputWrap, error && styles.inputWrapError]}>
            <TextInput
              accessibilityLabel="Custom reminder timing in minutes"
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(text) => {
                setMinutes(normalizeDigits(text).replace(/[^0-9]/g, ""));
                setError(null);
              }}
              selectTextOnFocus
              style={styles.input}
              value={localizeDigits(minutes, language)}
            />
            <Text style={styles.inputSuffix}>minutes before end</Text>
          </View>
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}

          <Text style={styles.note}>Phone silent mode and Do Not Disturb settings can affect notification sound.</Text>
          <AppButton label="Save timing" loading={saving} onPress={() => void save()} />
          </ScrollView>
    </BottomSheetModal>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  sheet: { alignSelf: "center", backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, maxWidth: 620, maxHeight: "90%", paddingHorizontal: spacing.xl, width: "100%", ...shadows.card },
  handle: { alignSelf: "center", backgroundColor: colors.sheetHandle, borderRadius: radii.pill, height: 5, marginBottom: spacing.lg, width: 44 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
  headerCopy: { flex: 1, paddingEnd: spacing.md },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 24, fontWeight: "800" },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  sectionLabel: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 12, fontWeight: "700", marginBottom: spacing.md },
  presets: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  preset: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: "center" },
  presetSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  presetText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_700Bold", fontSize: 13, fontWeight: "700" },
  presetTextSelected: { color: colors.onAccent },
  pressed: { opacity: 0.68 },
  inputLabel: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 12, fontWeight: "700", marginBottom: spacing.sm },
  inputWrap: { alignItems: "center", borderColor: colors.borderStrong, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", marginBottom: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md },
  inputWrapError: { borderColor: colors.danger },
  input: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "800", width: 64, flexShrink: 0, paddingVertical: spacing.sm },
  inputSuffix: { color: colors.inkSoft, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13 },
  error: { color: colors.danger, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, marginBottom: spacing.sm },
  note: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, lineHeight: 16, marginBottom: spacing.lg, marginTop: spacing.md }
}));
