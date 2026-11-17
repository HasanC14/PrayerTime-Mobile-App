import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "../i18n/context";
import { createThemedStyles } from "../theme";
import type { HeroArtworkId } from "../types";
import { getArtworkOpacity } from "../constants/appearance";

const illustrations: Record<HeroArtworkId, { source: ImageSourcePropType; aspectRatio: number }> = {
  serenity: { source: require("../../assets/illustrations/prayer-hero-mosque.png"), aspectRatio: 1.5 },
  skyline: { source: require("../../assets/illustrations/prayer-hero-skyline.png"), aspectRatio: 2 },
  moonlit: { source: require("../../assets/illustrations/prayer-hero-moonlit.png"), aspectRatio: 2 },
};

export function HeroArtwork({ artwork, thumbnail = false, muted = false }: { artwork: HeroArtworkId; thumbnail?: boolean; muted?: boolean }) {
  const { colors, styles, isDark, resolvedMode } = useStyles();
  const { isRTL } = useI18n();
  const illustration = illustrations[artwork];
  const start = muted ? colors.dangerHeroStart : colors.heroStart;
  const end = muted ? colors.dangerHeroEnd : colors.heroEnd;

  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <View style={[thumbnail ? styles.thumbnail : styles.artwork, !thumbnail && { aspectRatio: illustration.aspectRatio, top: artwork === "serenity" ? -8 : 0 }, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}>
      <Image source={illustration.source} accessible={false} resizeMode="contain"
        style={[styles.illustration, { opacity: muted ? (isDark ? 0.04 : 0.08) : getArtworkOpacity(resolvedMode) }]} />
    </View>
    <LinearGradient colors={[`${start}F2`, `${start}B3`, `${start}00`]} locations={[0, 0.28, 0.76]}
      start={{ x: isRTL ? 1 : 0, y: 0 }} end={{ x: isRTL ? 0 : 1, y: 0 }} style={StyleSheet.absoluteFill} />
    <LinearGradient colors={[`${end}00`, `${end}00`, `${end}B3`, `${end}F2`]} locations={[0, 0.5, 0.82, 1]} style={StyleSheet.absoluteFill} />
  </View>;
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  artwork: { position: "absolute", end: 0, width: "100%" },
  thumbnail: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  // Override the asset's intrinsic pixel dimensions within the responsive frame.
  illustration: { width: "100%", height: "100%" },
}));
