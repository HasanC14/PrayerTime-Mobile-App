import { useI18n } from "../i18n/context";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, Image as SvgImage, LinearGradient as SvgGradient, Mask, RadialGradient, Rect, Stop } from "react-native-svg";

const useNativeDriver = Platform.OS !== "web";
export const SPLASH_BACKGROUND = "#F6F4F8";

export function AnimatedSplash({ fontsReady, ready, onFinished }: {
  fontsReady: boolean;
  ready: boolean;
  onFinished: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const { t } = useI18n();
  const [laidOut, setLaidOut] = useState(false);
  const [started, setStarted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [logo] = useState(() => new Animated.Value(0));
  const [title] = useState(() => new Animated.Value(0));
  const [artwork] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const logoSize = Math.min(width * 0.32, height * 0.24, 148);
  const fontSize = Math.min(width * 0.11, 48);
  const titleLineHeight = Math.ceil(fontSize * 1.45);
  const brandHeight = logoSize + 28 + titleLineHeight + 20;
  const artworkWidth = Math.min(width * 1.65, height * 1.1, 1000);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    }).catch(() => { if (active) setReduceMotion(true); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!laidOut || !fontsReady || reduceMotion === null) return;
    let active = true;
    // Start motion only after the native launch screen uncovers this view.
    void SplashScreen.hideAsync().catch(() => undefined).then(() => {
      if (active) setStarted(true);
    });
    return () => { active = false; };
  }, [fontsReady, laidOut, reduceMotion]);

  useEffect(() => {
    if (!started || reduceMotion === null) return;
    if (reduceMotion) {
      logo.setValue(1);
      title.setValue(1);
      artwork.setValue(1);
      return;
    }
    const reveal = Animated.parallel([
      Animated.timing(logo, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.sequence([
        Animated.delay(40),
        Animated.timing(title, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver })
      ]),
      Animated.timing(artwork, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver })
    ]);
    reveal.start(({ finished }) => { if (finished) setEntered(true); });
    return () => reveal.stop();
  }, [artwork, logo, reduceMotion, started, title]);

  useEffect(() => {
    if (!ready || !started || (!entered && !reduceMotion)) return;
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion ? 0 : 160,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver
    });
    exit.start(({ finished }) => { if (finished) onFinished(); });
    return () => exit.stop();
  }, [entered, onFinished, opacity, ready, reduceMotion, started]);

  return (
    <Animated.View
      testID="animated-splash"
      accessibilityLabel={t("PrayerTime is loading")}
      accessibilityRole="progressbar"
      onLayout={() => setLaidOut(true)}
      style={[styles.screen, { opacity }]}
    >
      <StatusBar style="dark" />
      <LinearGradient colors={[SPLASH_BACKGROUND, "#EEE4F5", "#E1CDEE"]} locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0.7 }} end={{ x: 1, y: 0.15 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="halo" cx="35%" cy="40%" rx="85%" ry="65%">
              <Stop stopColor="#FFFFFF" stopOpacity="0.28" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#halo)" />
        </Svg>
      </View>
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[styles.artwork, { width: artworkWidth, height: artworkWidth / 2, right: -artworkWidth * 0.12,
          opacity: artwork.interpolate({ inputRange: [0, 1], outputRange: [0, 0.36] }),
          transform: [{ translateY: artwork.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }]
        }]}>
        <Svg width="100%" height="100%" viewBox="0 0 1774 887" accessible={false}>
          <Defs>
            <SvgGradient id="splash-artwork-fade" x1="0" y1="0" x2="0" y2="1">
              <Stop stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
            </SvgGradient>
            <Mask id="splash-artwork-mask" x="0" y="0" width="1774" height="887" maskUnits="userSpaceOnUse">
              <Rect width="1774" height="887" fill="url(#splash-artwork-fade)" />
            </Mask>
          </Defs>
          <SvgImage href={require("../../assets/illustrations/prayer-hero-moonlit.png")} width="1774" height="887" mask="url(#splash-artwork-mask)" />
        </Svg>
      </Animated.View>
      <View style={[styles.brand, { top: Math.max(24, height * 0.44 - brandHeight / 2) }]}>
        <Animated.View style={{ width: logoSize, height: logoSize, borderRadius: logoSize * 0.25, overflow: "hidden", opacity: logo, transform: [
          { translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }
        ] }}><Image source={require("../../assets/icons/app-icon.png")} accessible={false} style={styles.illustration} /></Animated.View>
        <Animated.View style={[styles.titleContainer, { opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
          {/* The brand is a fixed wordmark, independent of translated/scaled UI copy. */}
          <Text testID="splash-wordmark" allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
            style={[styles.title, { fontSize, lineHeight: titleLineHeight }]}>
            PrayerTime
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: SPLASH_BACKGROUND, overflow: "hidden", zIndex: 10 },
  artwork: { position: "absolute", bottom: -8 },
  illustration: { width: "100%", height: "100%" },
  brand: { position: "absolute", left: 24, right: 24, alignItems: "center", gap: 28 },
  titleContainer: { alignSelf: "stretch", paddingHorizontal: 8, paddingVertical: 10 },
  title: { color: "#24143A", fontFamily: "BricolageGrotesque_700Bold", letterSpacing: 0,
    includeFontPadding: true, textAlign: "center", writingDirection: "ltr", flexShrink: 1 }
});
