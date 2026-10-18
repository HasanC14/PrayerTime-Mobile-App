import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { createThemedStyles } from "../theme";

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
  const { height } = useWindowDimensions();
  const [rendered, setRendered] = useState(visible);
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(height));

  if (visible && !rendered) setRendered(true);

  useEffect(() => {
    let frameId: number | undefined;
    let cancelled = false;
    backdropOpacity.stopAnimation();
    sheetTranslateY.stopAnimation();

    if (visible) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(height);
      frameId = requestAnimationFrame(() => {
        Animated.sequence([
          Animated.timing(backdropOpacity, {
            duration: BACKDROP_DURATION_MS,
            easing: Easing.out(Easing.quad),
            toValue: 1,
            useNativeDriver: true
          }),
          Animated.timing(sheetTranslateY, {
            duration: SHEET_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            toValue: 0,
            useNativeDriver: true
          })
        ]).start();
      });
    } else if (rendered) {
      Animated.sequence([
        Animated.timing(sheetTranslateY, {
          duration: SHEET_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          toValue: height,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          duration: BACKDROP_DURATION_MS,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true
        })
      ]).start(({ finished }) => {
        if (finished && !cancelled) setRendered(false);
      });
    }

    return () => {
      cancelled = true;
      if (frameId !== undefined) cancelAnimationFrame(frameId);
    };
  }, [backdropOpacity, height, rendered, sheetTranslateY, visible]);

  return (
    <Modal animationType="none" transparent visible={rendered} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
          style={styles.sheetArea}
        >
          <Animated.View style={[sheetStyle, { transform: [{ translateY: sheetTranslateY }] }]}>
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
