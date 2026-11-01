import { HStack, Image, ProgressView, Rectangle, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import { aspectRatio, clipped, containerBackground, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, opacity, padding, progressViewStyle, resizable, scaleEffect, tint, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { PrayerWidgetProps } from "../services/widgetTimeline";

function HeroLayout(props: PrayerWidgetProps, environment: WidgetEnvironment) {
  "widget";
  const classic = props?.theme === "classic-dark";
  const dark = classic || props?.theme === "dark" || (props?.theme !== "light" && environment.colorScheme === "dark");
  const hero = props?.hero;
  const start = hero?.danger ? (dark ? "#303035" : "#E7E4EA") : (classic ? "#3C2850" : dark ? "#35323D" : "#E3D2F3");
  const end = hero?.danger ? (dark ? "#3B393F" : "#D8D4DE") : (classic ? "#60417C" : dark ? "#464050" : "#C5A7E2");
  const ink = hero?.danger ? (dark ? "#C9C4D1" : "#514C5B") : (classic ? "#F4EBFB" : dark ? "#E4E1E8" : "#24143A");
  const accent = hero?.danger ? ink : (classic ? "#C39BE5" : dark ? "#B5A2CC" : "#6F4B94");
  return <ZStack alignment="topTrailing" modifiers={[frame({ maxWidth: 10000, maxHeight: 10000 }), clipped(),
    containerBackground({ type: "linearGradient", colors: [start, end], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }, "widget"), widgetURL("prayertime://prayer")]}>
    {props?.artworkUri && hero && !hero.danger ? <Image uiImage={props.artworkUri} modifiers={[resizable(), aspectRatio({ ratio: 2, contentMode: "fill" }), frame({ maxWidth: 10000, maxHeight: 10000 }), clipped(), opacity(classic ? 0.30 : dark ? 0.18 : 0.94), scaleEffect({ x: props.isRTL ? -1 : 1, y: 1 })]} /> : null}
    <Rectangle modifiers={[foregroundStyle({ type: "linearGradient", colors: [start + "F2", start + "B3", start + "00"], startPoint: { x: props?.isRTL ? 1 : 0, y: 0 }, endPoint: { x: props?.isRTL ? 0 : 1, y: 0 } })]} />
    <Rectangle modifiers={[foregroundStyle({ type: "linearGradient", colors: [end + "00", end + "33", end + "F2"], startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 1 } })]} />
    <VStack alignment={props?.isRTL ? "trailing" : "leading"} spacing={7} modifiers={[frame({ maxWidth: 10000, maxHeight: 10000, alignment: props?.isRTL ? "trailing" : "leading" }), padding({ all: 16 })]}>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 23, weight: "bold" }), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.6)]}>{hero?.prayer ?? props?.prayer ?? "PrayerTime"}</Text>
        {hero ? <Text modifiers={[font({ size: 11 }), foregroundStyle(accent), lineLimit(1)]}>{hero.phaseLabel}</Text> : null}
      </HStack>
      {hero ? <Text timerInterval={{ lower: new Date(hero.start), upper: new Date(hero.target) }} countsDown
        modifiers={[font({ size: 35, weight: "bold" }), foregroundStyle(ink), frame({ width: 190, alignment: props?.isRTL ? "trailing" : "leading" }), lineLimit(1), minimumScaleFactor(0.6)]} /> : <Text modifiers={[font({ size: 14 }), foregroundStyle(ink)]}>{props?.date ?? "Open PrayerTime"}</Text>}
      {hero ? <ProgressView timerInterval={{ lower: new Date(hero.start), upper: new Date(hero.target) }} countsDown={false} modifiers={[progressViewStyle("linear"), tint(accent)]} /> : null}
      {hero ? <HStack spacing={6}>
        <Text modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.6)]}>{hero.footerLabel}</Text>
        <Spacer />
        <Text modifiers={[font({ size: 11, weight: "semibold" }), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.6)]}>{hero.footerTime}</Text>
      </HStack> : null}
    </VStack>
  </ZStack>;
}

export default createWidget("PrayerHero", HeroLayout);
