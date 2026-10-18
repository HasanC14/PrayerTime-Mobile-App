import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createThemedStyles, radii, shadows, spacing } from "../theme";
import { BottomSheetModal } from "./BottomSheetModal";
import { AppButton, IconButton } from "./ui";

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
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      closeLabel="Close alarm timing"
      onClose={onClose}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
    >
        <View accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.title}>Alarm timing</Text>
              <Text style={styles.subtitle}>This timing applies to every salat alarm enabled from the Prayer screen.</Text>
            </View>
            <IconButton icon="close" label="Close alarm timing" onPress={onClose} />
          </View>

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
              accessibilityLabel="Custom alarm timing in minutes"
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(text) => {
                setMinutes(text.replace(/[^0-9]/g, ""));
                setError(null);
              }}
              selectTextOnFocus
              style={styles.input}
              value={minutes}
            />
            <Text style={styles.inputSuffix}>minutes before end</Text>
          </View>
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}

          <Text style={styles.note}>Phone silent mode and Do Not Disturb settings can affect notification sound.</Text>
          <AppButton label="Save timing" loading={saving} onPress={() => void save()} />
        </View>
    </BottomSheetModal>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  sheet: { alignSelf: "center", backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, maxWidth: 620, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, width: "100%", ...shadows.card },
  handle: { alignSelf: "center", backgroundColor: colors.sheetHandle, borderRadius: radii.pill, height: 5, marginBottom: spacing.lg, width: 44 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
  headerCopy: { flex: 1, paddingRight: spacing.md },
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
  input: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "800", minWidth: 48, paddingVertical: spacing.sm },
  inputSuffix: { color: colors.inkSoft, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13 },
  error: { color: colors.danger, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, marginBottom: spacing.sm },
  note: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, lineHeight: 16, marginBottom: spacing.lg, marginTop: spacing.md }
}));
