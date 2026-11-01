import { Image, Rectangle, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import { aspectRatio, clipped, opacity, padding, resizable, scaleEffect, containerBackground, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { PrayerWidgetProps } from "../services/widgetTimeline";

function NextPrayerWidget(props: PrayerWidgetProps, environment: WidgetEnvironment) {
  "widget";
  const classic = props?.theme === "classic-dark";
  const dark = classic || props?.theme === "dark" || (props?.theme !== "light" && environment.colorScheme === "dark");
  const ink = classic ? "#F4EBFB" : dark ? "#E4E1E8" : "#24143A";
  const accent = classic ? "#C39BE5" : dark ? "#B5A2CC" : "#6F4B94";
  const scale = Math.max(0.9, Math.min(props?.textScale ?? 1, 1.2));
  const small = environment.widgetFamily === "systemSmall";
  return <ZStack alignment="topTrailing" modifiers={[frame({ maxWidth: 10000, maxHeight: 10000 }), clipped(),
    containerBackground({ type: "linearGradient", colors: [classic ? "#3C2850" : dark ? "#35323D" : "#E3D2F3", classic ? "#60417C" : dark ? "#464050" : "#C5A7E2"], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }, "widget"), widgetURL("prayertime://prayer")]}>
    {props?.artworkUri && !props?.empty ? <Image uiImage={props.artworkUri} modifiers={[resizable(), aspectRatio({ ratio: 2, contentMode: "fill" }), frame({ maxWidth: 10000, maxHeight: 10000 }), clipped(), opacity(dark ? 0.24 : 0.82), scaleEffect({ x: props.isRTL ? -1 : 1, y: 1 })]} /> : null}
    <Rectangle modifiers={[foregroundStyle({ type: "linearGradient", colors: [classic ? "#3C2850F2" : dark ? "#35323DF2" : "#E3D2F3F2", classic ? "#3C2850BF" : dark ? "#35323DBF" : "#E3D2F3BF", "#E3D2F300"], startPoint: { x: props?.isRTL ? 1 : 0, y: 0 }, endPoint: { x: props?.isRTL ? 0 : 1, y: 0 } })]} />
    <Rectangle modifiers={[foregroundStyle({ type: "linearGradient", colors: ["#C5A7E200", classic ? "#60417C55" : dark ? "#46405055" : "#C5A7E255", classic ? "#60417CCC" : dark ? "#464050CC" : "#C5A7E2CC"], startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 1 } })]} />
    <VStack alignment={props?.isRTL ? "trailing" : "leading"} spacing={small ? 5 : 7}
    modifiers={[frame({ maxWidth: 10000, maxHeight: 10000, alignment: props?.isRTL ? "trailing" : "leading" }), padding({ all: 16 })]}>
    <Text modifiers={[font({ size: 12 * scale, weight: "semibold" }), foregroundStyle(accent), lineLimit(1)]}>{props?.label ?? "PrayerTime"}</Text>
    <Text modifiers={[font({ size: (small ? 23 : 27) * scale, weight: "bold" }), foregroundStyle(ink), lineLimit(2), minimumScaleFactor(0.65)]}>{props?.prayer ?? "Open PrayerTime"}</Text>
    {props?.time ? <Text modifiers={[font({ size: (small ? 22 : 28) * scale, weight: "semibold" }), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.5)]}>{props.time}</Text> : null}
    <Text modifiers={[font({ size: 11 * scale }), foregroundStyle(accent), lineLimit(1), minimumScaleFactor(0.7)]}>{props?.date ?? ""}</Text>
    <Text modifiers={[font({ size: 11 * scale }), foregroundStyle(accent), lineLimit(1), minimumScaleFactor(0.7)]}>{props?.location ?? ""}</Text>
  </VStack></ZStack>;
}

export default createWidget("NextPrayer", NextPrayerWidget);
