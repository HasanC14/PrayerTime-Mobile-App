import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { useTasbeeh } from "../hooks/useTasbeeh";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { MAX_CUSTOM_TASBEEHS, MAX_TASBEEH_COUNT, TASBEEH_PRESETS, type TasbeehDefinition } from "../services/tasbeeh";
import { createThemedStyles } from "../theme";
import { useTextScale } from "../typography";
import { selectionFeedback } from "../utils/feedback";
import { AppButton, IconButton, ScreenHeader, SectionTitle } from "../components/ui";
import { BottomSheetModal } from "../components/BottomSheetModal";
import { SheetHeader } from "../components/SheetHeader";
import { CustomTasbeehForm } from "../components/CustomTasbeehForm";
import { TasbeehIcon } from "../components/TasbeehIcon";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 128;
const CIRCUMFERENCE = Math.PI * 2 * RADIUS;

export function TasbeehScreen() {
  const { colors, styles } = useStyles();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const textScale = useTextScale();
  const reducedMotion = useReducedMotion();
  const counter = useTasbeeh();
  const { selected, count, state, dispatch, ready, saveIssue } = counter;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"picker" | "custom" | "confirm">("picker");
  const [confirmation, setConfirmation] = useState<{ kind: "reset" | "delete"; definition: TasbeehDefinition } | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const complete = count >= selected.target;
  const size = Math.min(292, width - 64);
  const countFontSize = Math.min(64, (size - 70) / (String(count).length * 0.68 * textScale * fontScale));
  const customSelected = selected.id.startsWith("custom-");
  const selectedName = customSelected ? selected.name : t(selected.name);

  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: Math.min(count / selected.target, 1), duration: reducedMotion ? 0 : 140, easing: Easing.out(Easing.quad), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [count, progress, reducedMotion, selected.id, selected.target]);

  const increment = () => {
    if (!ready || count >= MAX_TASBEEH_COUNT) return;
    if (count + 1 === selected.target && Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    else selectionFeedback();
    dispatch({ type: "increment" });
  };
  const showCustom = () => setSheetMode("custom");
  const confirm = (kind: "reset" | "delete", definition: TasbeehDefinition) => {
    setConfirmation({ kind, definition }); setSheetMode("confirm"); setSheetOpen(true);
  };
  const renderChoice = (item: TasbeehDefinition, custom = false) => {
    const active = selected.id === item.id;
    const saved = state.counts[item.id] ?? 0;
    return <View key={item.id} style={[styles.choice, active && styles.choiceActive]}>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: active, selected: active }}
        accessibilityLabel={custom ? item.name : t(item.name)} accessibilityHint={t("Target {target}", { target: item.target })}
        onPress={() => { selectionFeedback(); dispatch({ type: "select", id: item.id }); setSheetOpen(false); }} style={styles.choiceButton}>
        <View style={styles.choiceIcon}><TasbeehIcon color={colors.accent} size={24} /></View>
        <View style={styles.choiceCopy}>
          <Text localize={!custom} style={styles.choiceName}>{item.name}</Text>
          <Text style={styles.choiceTarget}>{t("Target {target}", { target: item.target })}{saved ? ` · ${t("{count} counted", { count: saved })}` : ""}</Text>
        </View>
        <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} color={active ? colors.accent : colors.borderStrong} size={23} />
      </Pressable>
      {custom ? <IconButton icon="trash-outline" label={t("Delete {name}").replace("{name}", item.name)} onPress={() => confirm("delete", item)} /> : null}
    </View>;
  };

  return <View style={styles.screen}>
    <ScreenHeader title="Tasbeeh" action={<IconButton icon="refresh-outline" label="Reset counter" disabled={!ready || count === 0} onPress={() => confirm("reset", selected)} />} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
      <View style={styles.page}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("Select Tasbeeh, {name}").replace("{name}", selectedName)} disabled={!ready}
          onPress={() => { setSheetMode("picker"); setSheetOpen(true); }} style={({ pressed }) => [styles.selector, pressed && styles.pressed]}>
          <View style={styles.selectorIcon}><TasbeehIcon size={27} color={colors.accent} /></View>
          <View style={styles.selectorCopy}>
            <Text style={styles.eyebrow}>Selected Tasbeeh</Text>
            <Text localize={!customSelected} style={styles.selectorTitle}>{selected.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.inkSoft} />
        </Pressable>

        <View style={styles.counterArea}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("Add one to {name}").replace("{name}", selectedName)}
            accessibilityHint={t("{count} of {target}", { count, target: selected.target })} disabled={!ready || count >= MAX_TASBEEH_COUNT}
            onPress={increment} style={({ pressed }) => [styles.counter, { width: size, height: size }, pressed && { transform: [{ scale: 0.985 }] }]}>
            <Svg width={size} height={size} viewBox="0 0 280 280" accessible={false}>
              <Circle cx={140} cy={140} r={RADIUS} stroke={colors.border} strokeWidth={7} fill={colors.surface} />
              <AnimatedCircle cx={140} cy={140} r={RADIUS} stroke={complete ? colors.success : colors.accent} strokeWidth={7}
                fill="none" strokeLinecap="round" rotation={-90} origin="140,140" strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0] })} />
            </Svg>
            <View pointerEvents="none" style={styles.countCopy}>
              {!ready ? <ActivityIndicator color={colors.accent} /> : <>
                <Text accessibilityLiveRegion="polite" adjustsFontSizeToFit numberOfLines={1} style={[styles.count, { fontSize: countFontSize }]}>{count}</Text>
                <Text style={styles.target}>/ {selected.target}</Text>
              </>}
            </View>
          </Pressable>
          <View style={styles.counterHint}>
            {complete ? <Ionicons name="checkmark-circle" size={17} color={colors.success} /> : <Ionicons name="finger-print-outline" size={17} color={colors.inkSoft} />}
            <Text style={[styles.hint, complete && { color: colors.success }]}>Tap the circle to count</Text>
          </View>

        </View>
        {counter.loadIssue ? <View style={{ gap: 12, paddingBottom: 20 }}><Text style={styles.issue}>Your saved counter could not be loaded.</Text><AppButton label="Try again" onPress={counter.retryLoad} /></View> : null}
        {saveIssue ? <Text accessibilityLiveRegion="polite" style={styles.issue}>Your counter could not be saved. Please try again.</Text> : null}
      </View>
    </ScrollView>

    <BottomSheetModal visible={sheetOpen} onClose={() => setSheetOpen(false)}
      closeLabel={sheetMode === "picker" ? "Close Tasbeeh selection" : sheetMode === "custom" ? "Close custom Tasbeeh" : "Cancel"} sheetStyle={styles.sheet}>
      {sheetMode === "picker" ? <>
        <SheetHeader title="Select Tasbeeh" onClose={() => setSheetOpen(false)} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
          <AppButton label="Add custom Tasbeeh" icon="add" variant="secondary" disabled={state.custom.length >= MAX_CUSTOM_TASBEEHS} onPress={showCustom} />
          <SectionTitle>My Tasbeehs</SectionTitle>
          {state.custom.length ? state.custom.map(item => renderChoice(item, true)) : <Text style={styles.empty}>Your custom Tasbeehs will appear here.</Text>}
          <SectionTitle>Presets</SectionTitle>
          {TASBEEH_PRESETS.map(item => renderChoice(item))}
        </ScrollView>
      </> : sheetMode === "custom" ? <CustomTasbeehForm onClose={() => setSheetOpen(false)} onAdd={(name, target) => dispatch({ type: "add", definition: { id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, name, target } })} /> : <>
        <SheetHeader title={confirmation?.kind === "delete" ? "Delete Tasbeeh?" : "Reset counter?"} onClose={() => setSheetOpen(false)} />
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20), gap: 14 }}>
          <Text localize={false} style={styles.confirmName}>{confirmation?.definition.id.startsWith("custom-") ? confirmation.definition.name : t(confirmation?.definition.name ?? "")}</Text>
          <Text style={styles.confirmBody}>{confirmation?.kind === "delete" ? "Remove this custom Tasbeeh and its saved count." : "Only this counter will return to zero."}</Text>
          <AppButton label={confirmation?.kind === "delete" ? "Delete Tasbeeh" : "Reset counter"} onPress={() => {
            if (confirmation?.kind === "delete") dispatch({ type: "delete", id: confirmation.definition.id });
            else dispatch({ type: "reset" });
            setSheetOpen(false);
          }} />
          <AppButton label="Cancel" variant="quiet" onPress={() => { if (confirmation?.kind === "delete") setSheetMode("picker"); else setSheetOpen(false); }} />
        </ScrollView>
      </>}
    </BottomSheetModal>
  </View>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  page: { alignSelf: "center", width: "100%", maxWidth: 620, flex: 1 },
  selector: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16 },
  selectorIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSurface },
  selectorCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, marginBottom: 3 },
  selectorTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 18 },
  counterArea: { alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 28 },
  counter: { alignItems: "center", justifyContent: "center", borderRadius: 160 },
  countCopy: { position: "absolute", left: 28, right: 28, alignItems: "center", justifyContent: "center" },
  count: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 64, textAlign: "center", fontVariant: ["tabular-nums"], width: "100%" },
  target: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 18, textAlign: "center" },
  counterHint: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 24 },
  hint: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 13, textAlign: "center" },
  issue: { color: colors.warningText, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, marginBottom: 16 },
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "88%", paddingHorizontal: 20, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  choice: { flexDirection: "row", alignItems: "center", paddingEnd: 8, borderRadius: 18, backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderWidth: 1, marginBottom: 10 },
  choiceActive: { backgroundColor: colors.selectedSurface, borderColor: colors.accent },
  choiceButton: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, flex: 1 },
  choiceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSurface },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceName: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 16 },
  choiceTarget: { color: colors.accent, fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, marginTop: 5 },
  empty: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, padding: 16, textAlign: "center" },
  confirmName: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 19 },
  confirmBody: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 15, lineHeight: 22, marginBottom: 8 },
  pressed: { opacity: 0.75 }
}));
