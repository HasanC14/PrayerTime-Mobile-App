import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createThemedStyles, radii, shadows, spacing } from "../theme";
import { BottomSheetModal } from "./BottomSheetModal";
import { IconButton } from "./ui";

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
  return (
    <BottomSheetModal
      visible={visible}
      closeLabel={`Close ${title}`}
      onClose={onClose}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
    >
        <View accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <IconButton icon="close" label={`Close ${title}`} onPress={onClose} />
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <Ionicons name="checkmark" size={16} color={colors.onAccent} /> : null}
                  </View>
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
    paddingTop: spacing.sm,
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
  content: { gap: spacing.sm, paddingBottom: spacing.xl },
  option: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 66,
    padding: spacing.lg
  },
  optionSelected: { backgroundColor: colors.selectedSurface, borderColor: colors.borderStrong },
  optionPressed: { backgroundColor: colors.surfaceMuted },
  optionCopy: { flex: 1, paddingRight: spacing.lg },
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
