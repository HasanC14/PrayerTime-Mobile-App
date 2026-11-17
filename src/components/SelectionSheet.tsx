import { ScrollView, StyleSheet, View } from "react-native";
import { Pressable, Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createThemedStyles, radii, shadows, spacing } from "../theme";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import {useI18n} from "../i18n/context";
import { selectionFeedback } from "../utils/feedback";

interface SelectionOption {
  id: string | number;
  name: string;
  description?: string;
}

export function SelectionSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose
}: {
  visible: boolean;
  title: string;
  options: readonly SelectionOption[];
  value: string | number;
  onSelect: (value: string | number) => void;
  onClose: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const {t} = useI18n();
  return (
    <BottomSheetModal
      visible={visible}
      closeLabel={`Close ${title}`}
      onClose={onClose}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
    >
        <View accessibilityRole="radiogroup" accessibilityLabel={t(title)} testID="selection-sheet" accessibilityViewIsModal style={{ flexShrink: 1 }}>
          <SheetHeader title={title} onClose={onClose} />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flexShrink: 1 }}
          >
            {options.map((option) => {
              const selected = option.id === value;
              return (
                <Pressable
                  key={String(option.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={option.name}
                  accessibilityHint={option.description}
                  accessibilityState={{ selected, checked: selected }}
                  onPress={() => {
                    selectionFeedback();
                    onSelect(option.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionName, selected && styles.optionNameSelected]}>{option.name}</Text>
                    {option.description ? <Text style={styles.optionDescription}>{option.description}</Text> : null}
                  </View>
                  <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={24} color={selected ? colors.accent : colors.borderStrong} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
    </BottomSheetModal>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  sheet: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: "86%",
    maxWidth: 620,
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    width: "100%",
    ...shadows.card
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.sheetHandle,
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.lg,
    width: 44
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 24, fontWeight: "800" },
  content: { paddingBottom: spacing.xl },
  option: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    flexDirection: "row",
    minHeight: 66,
    padding: spacing.lg
  },
  optionSelected: { backgroundColor: colors.selectedSurface },
  optionPressed: { backgroundColor: colors.surfaceMuted },
  optionCopy: { flex: 1, paddingEnd: spacing.lg },
  optionName: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 16, fontWeight: "600" },
  optionNameSelected: { fontFamily: "BricolageGrotesque_800ExtraBold", fontWeight: "800" },
  optionDescription: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  radio: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  radioSelected: { backgroundColor: colors.accent, borderColor: colors.accent }
}));
