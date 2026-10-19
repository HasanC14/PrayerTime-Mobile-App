import { useLayoutEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { MAX_TEXT_SCALE, MIN_TEXT_SCALE, normalizeTextScale, TEXT_SCALE_STEP } from "../typography";
import { createThemedStyles } from "../theme";
import { IconButton } from "./ui";

export function TextSizeControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { colors, styles } = useStyles();
  const { isRTL, t } = useI18n();
  const [width, setWidth] = useState(0);
  const rail = useRef<View>(null);
  const latest = useRef({ value, onChange, isRTL, width, left: 0 });
  useLayoutEffect(() => { Object.assign(latest.current, { value, onChange, isRTL, width }); }, [value, onChange, isRTL, width]);
  const change = (next: number) => onChange(normalizeTextScale(next));
  const updateFromTouch = (pageX: number) => {
    const current = latest.current;
    const fraction = Math.max(0, Math.min(1, (pageX - current.left - 12) / Math.max(1, current.width - 24)));
    const next = normalizeTextScale(MIN_TEXT_SCALE + (current.isRTL ? 1 - fraction : fraction) * (MAX_TEXT_SCALE - MIN_TEXT_SCALE));
    if (next !== current.value) current.onChange(next);
  };
  const fraction = (value - MIN_TEXT_SCALE) / (MAX_TEXT_SCALE - MIN_TEXT_SCALE);
  const thumbX = (isRTL ? 1 - fraction : fraction) * Math.max(0, width - 24);
  const keyboard = Platform.OS === "web" ? { tabIndex: 0 as const, onKeyDown: (event: { key: string; preventDefault: () => void }) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") change(MIN_TEXT_SCALE);
    else if (event.key === "End") change(MAX_TEXT_SCALE);
    else change(value + ([isRTL ? "ArrowLeft" : "ArrowRight", "ArrowUp"].includes(event.key) ? TEXT_SCALE_STEP : -TEXT_SCALE_STEP));
  } } : {};

  return <View style={styles.container}>
    <View style={styles.heading}>
      <Text style={styles.title}>Text size</Text>
      <Text style={styles.percent}>{Math.round(value * 100)}%</Text>
    </View>
    <View style={styles.controls}>
      <IconButton icon="remove" label="Decrease text size" disabled={value <= MIN_TEXT_SCALE} onPress={() => change(value - TEXT_SCALE_STEP)} />
      <View ref={rail} {...keyboard}
        onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}
        onResponderGrant={event => {
          const x = event.nativeEvent.pageX;
          rail.current?.measureInWindow(left => { latest.current.left = left; updateFromTouch(x); });
        }}
        onResponderMove={event => updateFromTouch(event.nativeEvent.pageX)} collapsable={false}
        accessible accessibilityRole="adjustable" accessibilityLabel={t("Text size")}
        aria-valuemin={90} aria-valuemax={140} aria-valuenow={Math.round(value * 100)} aria-valuetext={t("{percent}% text size", { percent: Math.round(value * 100) })}
        accessibilityValue={{ min: 90, max: 140, now: Math.round(value * 100), text: t("{percent}% text size", { percent: Math.round(value * 100) }) }}
        accessibilityActions={[{ name: "increment", label: t("Increase text size") }, { name: "decrement", label: t("Decrease text size") }]}
        onAccessibilityAction={event => change(value + (event.nativeEvent.actionName === "increment" ? TEXT_SCALE_STEP : -TEXT_SCALE_STEP))}
        onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.rail}>
        <View style={styles.track} pointerEvents="none" />
        <View pointerEvents="none" style={[styles.fill, { width: Math.max(0, width - 24) * fraction, [isRTL ? "right" : "left"]: 12 }]} />
        <View pointerEvents="none" style={[styles.thumb, { left: thumbX }]} />
      </View>
      <IconButton icon="add" label="Increase text size" disabled={value >= MAX_TEXT_SCALE} onPress={() => change(value + TEXT_SCALE_STEP)} />
    </View>
    <Text style={styles.preview}>A little more room to read.</Text>
    <View style={styles.footer}>
      <Text style={styles.caption}>Applies across the app</Text>
      {value !== 1 ? <Pressable accessibilityRole="button" accessibilityLabel="Reset text size" onPress={() => change(1)} hitSlop={10}>
        <Text style={[styles.reset, { color: colors.accent }]}>Reset</Text>
      </Pressable> : null}
    </View>
  </View>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  container: { padding: 16, gap: 8 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15 },
  percent: { color: colors.accent, fontFamily: "BricolageGrotesque_700Bold", fontSize: 13 },
  controls: { flexDirection: "row", alignItems: "center", gap: 14 },
  rail: { flex: 1, height: 48, justifyContent: "center", direction: "ltr" },
  track: { position: "absolute", left: 12, right: 12, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong },
  fill: { position: "absolute", height: 4, borderRadius: 2, backgroundColor: colors.accent },
  thumb: { position: "absolute", width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: colors.surface, backgroundColor: colors.accent },
  preview: { color: colors.ink, fontFamily: "BricolageGrotesque_500Medium", fontSize: 15, paddingTop: 2 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  caption: { flex: 1, color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 11 },
  reset: { fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12 }
}));
