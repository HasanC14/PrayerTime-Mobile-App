import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import {useI18n} from "../i18n/context";
import { THEME_OPTIONS } from "../constants/settings";
import { AppThemeProvider, createThemedStyles } from "../theme";
import { TextScaleProvider } from "../typography";
import type { HeroArtworkId, ThemeMode } from "../types";
import { selectionFeedback } from "../utils/feedback";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { HeroArtwork } from "./HeroArtwork";

function ThemePreview({artwork}: {artwork: HeroArtworkId}) {
  const {colors, styles} = useStyles();
  return <View style={styles.sample} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
    <LinearGradient colors={[colors.heroStart, colors.heroEnd]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.miniCard}>
      <HeroArtwork artwork={artwork} thumbnail />
      <TextScaleProvider value={1}>
        <Text style={styles.miniPrayer}>Asr</Text>
        <Text style={styles.miniTime} localize={false}>21m</Text>
      </TextScaleProvider>
      <View style={[styles.miniTrack, {backgroundColor: colors.heroTrack}]}><View style={[styles.miniFill, {backgroundColor: colors.accent}]} /></View>
    </LinearGradient>
  </View>;
}

export function AppearanceSheet({visible, value, artwork, onSelect, onClose}: {
  visible: boolean; value: ThemeMode; artwork: HeroArtworkId; onSelect: (mode: ThemeMode) => void; onClose: () => void;
}) {
  const {colors, styles} = useStyles();
  const insets = useSafeAreaInsets();
  const {t} = useI18n();
  const choose = (mode: ThemeMode) => {selectionFeedback(); onSelect(mode); onClose();};
  return <BottomSheetModal visible={visible} closeLabel="Close Appearance" onClose={onClose} sheetStyle={styles.sheet}>
    <SheetHeader title="Appearance" onClose={onClose} />
    <ScrollView accessibilityRole="radiogroup" accessibilityLabel={t("Appearance")} style={{flexShrink: 1}} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: Math.max(insets.bottom, 20), gap: 12}}>
      <Pressable accessibilityRole="radio" accessibilityLabel="System" accessibilityState={{selected: value === "system", checked: value === "system"}}
        onPress={() => choose("system")} style={({pressed}) => [styles.system, value === "system" && styles.selected, pressed && {opacity: .75}]}>
        <Ionicons name="contrast-outline" size={22} color={colors.accent} />
        <View style={{flex: 1, gap: 3}}><Text style={styles.name}>System</Text><Text style={styles.description}>Follow your phone’s appearance setting.</Text></View>
        <Ionicons name={value === "system" ? "checkmark-circle" : "ellipse-outline"} size={22} color={value === "system" ? colors.accent : colors.borderStrong} />
      </Pressable>
      <View style={styles.grid}>
        {THEME_OPTIONS.filter(option => option.id !== "system").map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.name}
          accessibilityState={{selected: option.id === value, checked: option.id === value}} onPress={() => choose(option.id)}
          style={({pressed}) => [styles.option, option.id === value && styles.selected, pressed && {opacity: .75}]}>
          <AppThemeProvider mode={option.id}><ThemePreview artwork={artwork} /></AppThemeProvider>
          <View style={styles.caption}><Text style={styles.name}>{option.name}</Text><Ionicons name={option.id === value ? "checkmark-circle" : "ellipse-outline"}
            size={20} color={option.id === value ? colors.accent : colors.borderStrong} /></View>
        </Pressable>)}
      </View>
    </ScrollView>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: {alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "90%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20},
  grid: {flexDirection: "row", flexWrap: "wrap", gap: 10},
  option: {flexBasis: "46%", flexGrow: 1, maxWidth: "50%", padding: 6, borderRadius: 18, borderWidth: 1, borderColor: colors.border, gap: 10},
  selected: {borderColor: colors.accent, backgroundColor: colors.selectedSurface},
  system: {flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 64},
  sample: {padding: 8, backgroundColor: colors.background, borderRadius: 12},
  miniCard: {height: 84, padding: 10, borderRadius: 10, overflow: "hidden", justifyContent: "space-between"},
  miniPrayer: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, color: colors.ink},
  miniTime: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 22, color: colors.ink},
  miniTrack: {height: 2, borderRadius: 1, overflow: "hidden"},
  miniFill: {height: 2, width: "65%"},
  caption: {flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6, paddingHorizontal: 6, paddingBottom: 6},
  name: {flexShrink: 1, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 14, color: colors.ink},
  description: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, color: colors.inkSoft},
}));
