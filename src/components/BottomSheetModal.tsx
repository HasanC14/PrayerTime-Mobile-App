import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, findNodeHandle, Text as NativeText, Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "../i18n/native";

import { createThemedStyles } from "../theme";
import { useI18n } from "../i18n/context";
import {SheetFocusContext} from "./SheetFocusContext";
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
  const headingRef = useRef<NativeText>(null);
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

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (Platform.OS === "web") headingRef.current?.focus();
      else {const tag = findNodeHandle(headingRef.current); if (tag) AccessibilityInfo.setAccessibilityFocus(tag);}
    }, reducedMotion ? 30 : SHEET_DURATION_MS + 30);
    return () => clearTimeout(timer);
  }, [reducedMotion, visible]);

  return (
    <Modal animationType="none" transparent visible={rendered} onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { direction: isRTL ? "rtl" : "ltr" }]}>
        <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            accessible={false}
            tabIndex={-1}
            accessibilityLabel={closeLabel}
            onPress={onClose}
            disabled={!visible}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
          pointerEvents="box-none"
          style={styles.sheetArea}
        >
          <Animated.View accessibilityViewIsModal pointerEvents={visible ? "auto" : "none"} style={[sheetStyle, { flexShrink: 1, minHeight: 0, transform: [{ translateY: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}>
            <SheetFocusContext.Provider value={headingRef}>{children}</SheetFocusContext.Provider>
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
