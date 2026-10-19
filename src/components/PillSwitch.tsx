import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet } from "react-native";
import { Pressable } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { useAppTheme } from "../theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { selectionFeedback } from "../utils/feedback";

export function PillSwitch({ value, disabled = false, busy = false, label, onValueChange }: {
  value: boolean; disabled?: boolean; busy?: boolean; label: string; onValueChange: (value: boolean) => void;
}) {
  const { colors } = useAppTheme();
  const { isRTL } = useI18n();
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: value ? 1 : 0, duration: reducedMotion ? 0 : 170, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, value]);
  const keyboardProps = Platform.OS === "web" ? {
    onKeyDown: (event: { key: string; repeat: boolean; preventDefault: () => void }) => {
      if (event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat && !disabled && !busy) { selectionFeedback(); onValueChange(!value); }
    }
  } : {};
  return <Pressable {...keyboardProps} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value, disabled: disabled || busy, busy }}
    disabled={disabled || busy} hitSlop={8} onPress={() => { selectionFeedback(); onValueChange(!value); }}
    style={[styles.track, { borderColor: colors.accent, backgroundColor: value ? colors.accent : "transparent", opacity: disabled ? 0.4 : 1 }]}>
    <Animated.View style={[styles.thumb, { backgroundColor: value ? colors.onAccent : colors.accent,
      transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: isRTL ? [24, 0] : [0, 24] }) }] }]}>
      {busy ? <ActivityIndicator size={12} color={value ? colors.accent : colors.onAccent} /> : null}
    </Animated.View>
  </Pressable>;
}

const styles = StyleSheet.create({
  track: { width: 56, height: 32, borderRadius: 18, borderWidth: 2, justifyContent: "center", flexShrink: 0, direction: "ltr" },
  thumb: { width: 22, height: 22, borderRadius: 11, position: "absolute", left: 3, alignItems: "center", justifyContent: "center" }
});
