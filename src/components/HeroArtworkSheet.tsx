import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import { HERO_ARTWORK_OPTIONS } from "../constants/heroArtwork";
import { createThemedStyles, radii, shadows, spacing } from "../theme";
import type { HeroArtworkId } from "../types";
import { selectionFeedback } from "../utils/feedback";
import { BottomSheetModal } from "./BottomSheetModal";
import { HeroArtwork } from "./HeroArtwork";
import { SheetHeader } from "./SheetHeader";

export function HeroArtworkSheet({ visible, value, onSelect, onClose }: {
  visible: boolean;
  value: HeroArtworkId;
  onSelect: (artwork: HeroArtworkId) => void;
  onClose: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();

  return <BottomSheetModal visible={visible} closeLabel="Close Prayer card artwork" onClose={onClose}
    sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
    <SheetHeader title="Prayer card artwork" onClose={onClose} />
    <ScrollView style={styles.scroll} contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
      {HERO_ARTWORK_OPTIONS.map(option => {
        const selected = value === option.id;
        return <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.name}
          accessibilityState={{ selected, checked: selected }} onPress={() => {
            selectionFeedback();
            onSelect(option.id);
            onClose();
          }} style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}>
          <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
            <HeroArtwork artwork={option.id} thumbnail />
          </LinearGradient>
          <View style={styles.copy}>
            <Text style={[styles.name, selected && styles.selectedName]}>{option.name}</Text>
          </View>
          <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={24} color={selected ? colors.accent : colors.borderStrong} />
        </Pressable>;
      })}
    </ScrollView>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "86%", backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingHorizontal: spacing.xl, ...shadows.card },
  scroll: { flexShrink: 1 },
  options: { gap: spacing.sm, paddingBottom: spacing.sm },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, minHeight: 98,
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.accent, backgroundColor: colors.selectedSurface },
  pressed: { opacity: 0.75 },
  preview: { width: "38%", aspectRatio: 2, borderRadius: radii.sm, overflow: "hidden" },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15 },
  selectedName: { color: colors.accent, fontFamily: "BricolageGrotesque_800ExtraBold" },
}));
