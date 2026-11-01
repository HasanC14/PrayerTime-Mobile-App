import { useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "../i18n/native";

import { createThemedStyles } from "../theme";
import { useI18n } from "../i18n/context";
import { useReducedMotion } from "../hooks/useReducedMotion";

const BACKDROP_DURATION_MS = 170;
const SHEET_DURATION_MS = 240;

export function BottomSheetModal({
  visible,
  closeLabel,
  onClose,
  sheetStyle,
  children
}: {
  visible: boolean;
  closeLabel: string;
  onClose: () => void;
  sheetStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { styles } = useStyles();
  const { isRTL } = useI18n();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetProgress] = useState(() => new Animated.Value(1));

  if (visible && !rendered) setRendered(true);

  useEffect(() => {
    let frameId: number | undefined;
    let cancelled = false;
    backdropOpacity.stopAnimation();
    sheetProgress.stopAnimation();

    if (visible) {
      backdropOpacity.setValue(0);
      sheetProgress.setValue(1);
      frameId = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            duration: reducedMotion ? 0 : BACKDROP_DURATION_MS,
            easing: Easing.out(Easing.quad),
            toValue: 1,
            useNativeDriver: Platform.OS !== "web"
          }),
          Animated.timing(sheetProgress, {
            duration: reducedMotion ? 0 : SHEET_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            toValue: 0,
            useNativeDriver: Platform.OS !== "web"
          })
        ]).start();
      });
    } else if (rendered) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(sheetProgress, {
          duration: reducedMotion ? 0 : SHEET_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          toValue: 1,
          useNativeDriver: Platform.OS !== "web"
        }),
        Animated.timing(backdropOpacity, {
          duration: reducedMotion ? 0 : BACKDROP_DURATION_MS,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: Platform.OS !== "web"
        })
      ]).start(({ finished }) => {
        if (finished && !cancelled) setRendered(false);
      });
    }

    return () => {
      cancelled = true;
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      backdropOpacity.stopAnimation();
      sheetProgress.stopAnimation();
    };
  }, [backdropOpacity, reducedMotion, rendered, sheetProgress, visible]);

  return (
    <Modal animationType="none" transparent visible={rendered} onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
          pointerEvents="box-none"
          style={styles.sheetArea}
        >
          <Animated.View accessibilityViewIsModal style={[sheetStyle, { flexShrink: 1, minHeight: 0, transform: [{ translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.backdrop },
  sheetArea: { flex: 1, justifyContent: "flex-end" }
}));
