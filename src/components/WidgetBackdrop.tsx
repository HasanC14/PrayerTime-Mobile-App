import {useState} from "react";
import {Image, StyleSheet, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useI18n} from "../i18n/context";
import {useAppTheme} from "../theme";
import {getWidgetAppearance} from "../constants/appearance";
import type {HeroArtworkId} from "../types";

const illustrations = {
  serenity: {source: require("../../assets/illustrations/prayer-hero-mosque.png"), ratio: 1.5},
  skyline: {source: require("../../assets/illustrations/prayer-hero-skyline.png"), ratio: 2},
  moonlit: {source: require("../../assets/illustrations/prayer-hero-moonlit.png"), ratio: 2}
};

// Cover the whole widget, anchored to the illustration rather than centering a
// landscape image inside a square. There is no image edge inside the card.
export function WidgetBackdrop({artwork, detailed, danger, empty}: {
  artwork: HeroArtworkId; detailed: boolean; danger: boolean; empty: boolean;
}) {
  const {resolvedMode} = useAppTheme();
  const {isRTL} = useI18n();
  const palette = getWidgetAppearance(resolvedMode).light;
  const [size, setSize] = useState({width: 0, height: 0});
  const start = danger ? palette.dangerStart : detailed ? palette.detailStart! : palette.start;
  const end = danger ? palette.dangerEnd : detailed ? palette.detailEnd! : palette.end;
  const illustration = illustrations[artwork];
  const imageHeight = Math.max(size.height, size.width / illustration.ratio);
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, {overflow: "hidden"}]} onLayout={event => {
      const {width, height} = event.nativeEvent.layout;
      setSize(previous => previous.width === width && previous.height === height ? previous : {width, height});
    }}>
    <LinearGradient colors={[start, end]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
    {!empty && !danger && size.width > 0 ? <Image source={illustration.source} accessible={false} resizeMode="stretch"
      style={{position: "absolute", top: 0, right: isRTL ? undefined : 0, left: isRTL ? 0 : undefined,
        width: imageHeight * illustration.ratio, height: imageHeight,
        opacity: detailed ? palette.detailArtworkOpacity : palette.artworkOpacity,
        transform: [{scaleX: isRTL ? -1 : 1}]}} /> : null}
    <LinearGradient colors={[start + "F2", start + "A6", start + "00"]} locations={[0, .28, .9]}
      start={{x: isRTL ? 1 : 0, y: 0}} end={{x: isRTL ? 0 : 1, y: 0}} style={StyleSheet.absoluteFill} />
    <LinearGradient colors={[end + "00", end + "00", end + "E6"]} locations={[0, .48, 1]} style={StyleSheet.absoluteFill} />
  </View>;
}
