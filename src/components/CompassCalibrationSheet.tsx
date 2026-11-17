import { useEffect, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../i18n/native";
import { createThemedStyles } from "../theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { AppButton } from "./ui";

const SAMPLES = Array.from({length: 65}, (_, index) => index / 64);
const FIGURE_END = .72;
const INPUT = [...SAMPLES.map(value => value * FIGURE_END), .86, 1];
const TRAIL = SAMPLES.map((value, index) => `${index ? "L" : "M"}${145 + Math.sin(value * Math.PI * 2) * 83} ${90 + Math.sin(value * Math.PI * 4) * 33}`).join(" ");

export function CompassCalibrationGuide({active, ready = false, compact = false}: {active: boolean; ready?: boolean; compact?: boolean}) {
  const {colors, styles} = useStyles();
  const reduced = useReducedMotion();
  const [phase] = useState(() => new Animated.Value(0));
  const [flat, setFlat] = useState(false);
  useEffect(() => {
    phase.setValue(0);
    if (!active || reduced || ready) return;
    let previousStep: boolean | null = null;
    const listener = phase.addListener(({value}) => {
      const nextStep = value >= FIGURE_END;
      if (nextStep !== previousStep) {previousStep = nextStep; setFlat(nextStep);}
    });
    const loop = Animated.loop(Animated.timing(phase, {toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true}));
    loop.start();
    return () => {loop.stop(); phase.removeListener(listener);};
  }, [active, phase, ready, reduced]);
  const holdingFlat = ready || (!reduced && flat);
  return <View style={[styles.guide, compact && styles.compact]}>
    <View style={styles.animation} accessible accessibilityLabel="Move your phone slowly in a figure eight, then hold it flat.">
      <Svg width={290} height={220} viewBox="0 0 290 220" accessible={false}>
        <Path d={TRAIL} fill="none" stroke={colors.borderStrong} strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" />
        <Path d="M211 52l14 5-7 12" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="145" cy="90" r="3" fill={colors.accent} />
      </Svg>
      <Animated.View testID="calibration-phone" style={[styles.phone, {transform: [
        {perspective: 500},
        {translateX: phase.interpolate({inputRange: INPUT, outputRange: [...SAMPLES.map(value => Math.sin(value * Math.PI * 4) * 83), 0, 0]})},
        {translateY: phase.interpolate({inputRange: INPUT, outputRange: [...SAMPLES.map(value => Math.sin(value * Math.PI * 8) * 33), 8, 8]})},
        {rotateX: ready ? "58deg" : phase.interpolate({inputRange: [0, FIGURE_END, .86, 1], outputRange: ["0deg", "0deg", "58deg", "58deg"]})},
        {rotateZ: phase.interpolate({inputRange: INPUT, outputRange: [...SAMPLES.map(value => `${Math.sin(value * Math.PI * 4) * 20}deg`), "0deg", "0deg"]})}
      ]}]}>
        <Svg width={86} height={122} viewBox="0 0 86 122" accessible={false}>
          <Path d="M28 65C16 62 10 68 17 79l12 20 5 20h34l-1-28c0-11-5-16-11-19l-5-3V48c0-9-13-9-13 0v29l-10-12Z"
            fill={colors.selectedSurface} stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" />
          <Rect x="21" y="3" width="43" height="74" rx="10" fill={colors.surface} stroke={colors.accent} strokeWidth={2.5} />
          <Rect x="26" y="13" width="33" height="51" rx="5" fill={colors.accentSurface} />
          <Path d="M36 8h13M33 88V66c0-9 12-9 12 0v14" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" />
          <Circle cx="42.5" cy="70" r="2" fill={colors.accent} />
        </Svg>
      </Animated.View>
    </View>
    <View accessibilityLiveRegion="polite" style={styles.instruction}>
      <Text style={styles.step}>{ready ? "Compass accuracy improved" : holdingFlat ? "2 · Hold your phone flat" : "1 · Move in a wide figure eight"}</Text>
      <Text style={styles.caption}>{reduced ? "Trace a wide eight in the air, then hold your phone flat." : holdingFlat ? "Keep it level for a moment." : "Follow the movement with your phone."}</Text>
    </View>
    {!compact ? <Text style={styles.hint}>Keep away from magnets and metal.</Text> : null}
  </View>;
}

export function CompassCalibrationSheet({visible, accuracy, onClose}: {visible: boolean; accuracy: number | null; onClose: () => void}) {
  const {styles} = useStyles();
  const insets = useSafeAreaInsets();
  const ready = accuracy !== null && Number.isFinite(accuracy) && accuracy >= 2;
  return <BottomSheetModal visible={visible} onClose={onClose} closeLabel="Close compass calibration" sheetStyle={styles.sheet}>
    <SheetHeader title="Calibrate your compass" onClose={onClose} />
    <ScrollView style={{flexShrink: 1}} contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 20)}]}>
      <CompassCalibrationGuide active={visible} ready={ready} />
      {ready ? <View style={styles.status} accessibilityLiveRegion="polite"><Ionicons name="checkmark-circle" size={20} color={styles.statusText.color} /><Text style={styles.statusText}>Ready to find the Qibla</Text></View> : null}
      <AppButton label={ready ? "Continue" : "Try the compass"} onPress={onClose} />
    </ScrollView>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: {alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "90%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20},
  content: {gap: 20},
  guide: {gap: 16},
  compact: {backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 12},
  animation: {height: 220, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted, borderRadius: 22, overflow: "hidden", direction: "ltr"},
  phone: {position: "absolute", left: "50%", top: 53, marginLeft: -43},
  instruction: {gap: 6, minHeight: 64},
  step: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 17, lineHeight: 25, color: colors.ink, textAlign: "center"},
  caption: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 21, color: colors.inkSoft, textAlign: "center"},
  hint: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, color: colors.inkSoft, textAlign: "center"},
  status: {flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8},
  statusText: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 13, color: colors.success, flexShrink: 1},
}));
