import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

const useNativeDriver = Platform.OS !== "web";
export const SPLASH_BACKGROUND = "#B99ADB";

function MosqueMark({ height }: { height: number }) {
  return (
    <Svg width={height * 0.64} height={height} viewBox="0 0 120 188" fill="none">
      <Defs>
        <SvgGradient id="mosque" x1="20" y1="0" x2="104" y2="188" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FAF0FF" />
          <Stop offset="1" stopColor="#D8BCEB" />
        </SvgGradient>
      </Defs>
      <Path d="M64 2C44 2 34 18 39 33C44 49 64 52 77 39C63 45 49 35 49 21C49 13 55 6 64 2Z" fill="url(#mosque)" />
      <Path d="M78 3L82 15H95L85 23L89 35L78 28L67 35L71 23L61 15H74Z" fill="url(#mosque)" />
      <Path d="M60 57C53 69 16 78 16 101C16 110 20 117 25 123H95C100 117 104 110 104 101C104 78 67 69 60 57Z" fill="url(#mosque)" stroke="#F8EEFF" strokeOpacity="0.35" />
      <Rect x="13" y="126" width="94" height="8" rx="4" fill="url(#mosque)" />
      <Path fillRule="evenodd" d="M22 138H98V186H71V155C71 141 49 141 49 155V186H22V138ZM27 153C27 143 41 143 41 153V170H27V153ZM79 153C79 143 93 143 93 153V170H79V153Z" fill="url(#mosque)" />
    </Svg>
  );
}

function Arches() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 420" preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="arch" x1="0" y1="0" x2="0" y2="1">
          <Stop stopColor="#E5CAF5" stopOpacity="0.64" />
          <Stop offset="1" stopColor="#C8A5E1" stopOpacity="0.06" />
        </SvgGradient>
      </Defs>
      <Path d="M-90 420V305C-90 232 17 207 34 166C51 207 158 232 158 305V420ZM242 420V305C242 232 349 207 366 166C383 207 490 232 490 305V420Z" fill="url(#arch)" opacity="0.6" />
      <Path d="M62 420V170C62 91 181 54 200 0C219 54 338 91 338 170V420Z" fill="url(#arch)" />
      <Path d="M82 420V245C82 175 183 137 200 88C217 137 318 175 318 245V420Z" fill="url(#arch)" />
      <Path d="M106 420V322C106 263 184 230 200 181C216 230 294 263 294 322V420Z" fill="url(#arch)" />
    </Svg>
  );
}

export function AnimatedSplash({ fontsReady, ready, onFinished }: {
  fontsReady: boolean;
  ready: boolean;
  onFinished: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [laidOut, setLaidOut] = useState(false);
  const [started, setStarted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [logo] = useState(() => new Animated.Value(0));
  const [title] = useState(() => new Animated.Value(0));
  const [arches] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const logoHeight = Math.min(height * 0.31, 190);

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
      arches.setValue(1);
      return;
    }
    const reveal = Animated.parallel([
      Animated.timing(logo, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.sequence([
        Animated.delay(160),
        Animated.timing(title, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver })
      ]),
      Animated.timing(arches, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver })
    ]);
    reveal.start(({ finished }) => { if (finished) setEntered(true); });
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver }),
      Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver })
    ]));
    breathe.start();
    return () => { reveal.stop(); breathe.stop(); };
  }, [arches, glow, logo, reduceMotion, started, title]);

  useEffect(() => {
    if (!ready || !started || (!entered && !reduceMotion)) return;
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: reduceMotion ? 0 : 280,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver
    });
    exit.start(({ finished }) => { if (finished) onFinished(); });
    return () => exit.stop();
  }, [entered, onFinished, opacity, ready, reduceMotion, started]);

  return (
    <Animated.View
      testID="animated-splash"
      accessibilityLabel="PrayerTime is loading"
      accessibilityRole="progressbar"
      onLayout={() => setLaidOut(true)}
      style={[styles.screen, { opacity }]}
    >
      <StatusBar style="light" />
      <LinearGradient colors={["#C7A8E0", SPLASH_BACKGROUND, "#8D78BA"]} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] }),
        transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }]
      }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="halo" cx="48%" cy="28%" rx="75%" ry="48%">
              <Stop stopColor="#EDDBFA" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#EDDBFA" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#halo)" />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.arches, { height: height * 0.45, opacity: arches,
        transform: [{ translateY: arches.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }]
      }]}><Arches /></Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: logo }]}>
        <View style={[styles.sparkle, { top: height * 0.35, left: width * 0.09 }]}><Sparkle /></View>
        <View style={[styles.sparkle, { top: height * 0.28, right: width * 0.11 }]}><Sparkle /></View>
      </Animated.View>
      <View style={[styles.brand, { top: height * 0.43 - logoHeight - 20 }]}>
        <Animated.View style={{ opacity: logo, transform: [
          { translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }
        ] }}><MosqueMark height={logoHeight} /></Animated.View>
        <Animated.View style={{ opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          <Text allowFontScaling={false} style={[styles.title, { fontSize: Math.min(width * 0.095, 40) }]}>
            PRAYERTIME
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function Sparkle() {
  return <Svg width={7} height={9} viewBox="0 0 10 12"><Path d="M5 0L6.1 4.8L10 6L6.1 7.2L5 12L3.9 7.2L0 6L3.9 4.8Z" fill="#FCF5FF" fillOpacity="0.8" /></Svg>;
}

const styles = StyleSheet.create({
  screen: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: SPLASH_BACKGROUND, overflow: "hidden", zIndex: 10 },
  arches: { position: "absolute", bottom: 0, left: 0, right: 0 },
  brand: { position: "absolute", left: 0, right: 0, alignItems: "center", gap: 20 },
  title: { color: "#FFFFFF", fontFamily: "BricolageGrotesque_800ExtraBold", letterSpacing: 1.2, lineHeight: 52, textAlign: "center" },
  sparkle: { position: "absolute" }
});
