import { Image, Rectangle, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import { aspectRatio, clipped, containerBackground, environment as environmentValue, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, opacity, padding, resizable, scaleEffect, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { PrayerWidgetProps } from "../services/widgetTimeline";

function NextPrayerWidget(props: PrayerWidgetProps, environment: WidgetEnvironment) {
  "widget";
  const palette = props?.appearance?.followsSystem && environment.colorScheme === "dark" ? props.appearance.dark : props?.appearance?.light;
  const classic = props?.theme === "classic-dark";
  const dark = palette?.dark ?? (classic || props?.theme === "dark" || props?.theme === "midnight-blue" || ((!props?.theme || props.theme === "system") && environment.colorScheme === "dark"));
  const start = palette?.start ?? (classic ? "#3C2850" : dark ? "#30303C" : "#E3D2F3");
  const end = palette?.end ?? (classic ? "#60417C" : dark ? "#414052" : "#C5A7E2");
  const ink = palette?.ink ?? (dark ? "#EEEAF2" : "#24143A");
  const accent = palette?.accent ?? (dark ? "#C0ACD7" : "#6F4B94");
  const muted = palette?.heroMuted ?? (dark ? "#CEC4DA" : "#503E5D");
  const scale = Math.max(.9, Math.min(props?.textScale ?? 1, 1.2));
  const align = props?.isRTL ? "trailing" : "leading";
  const small = environment.widgetFamily === "systemSmall";
  return <ZStack alignment="topTrailing" modifiers={[frame({maxWidth: 10000, maxHeight: 10000}), clipped(),
    containerBackground({type: "linearGradient", colors: [start, end], startPoint: {x: 0, y: 0}, endPoint: {x: 1, y: 1}}, "widget"), widgetURL("prayertime://prayer"), environmentValue("locale", props?.language === "bn" ? "bn_BD" : props?.language === "ar" || props?.isRTL ? "ar" : "en_US")]}>
    {props?.artworkUri && !props?.empty ? <Image uiImage={props.artworkUri} modifiers={[resizable(), aspectRatio({contentMode: "fill"}), frame({maxWidth: 10000, maxHeight: 10000, alignment: "topTrailing"}), clipped(), opacity(palette?.artworkOpacity ?? (dark ? .3 : .85)), scaleEffect({x: props.isRTL ? -1 : 1, y: 1})]} /> : null}
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [start + "F2", start + "A6", start + "00"], startPoint: {x: props?.isRTL ? 1 : 0, y: 0}, endPoint: {x: props?.isRTL ? 0 : 1, y: 0}})]} />
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [end + "00", end + "00", end + "E6"], startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 1}})]} />
    <VStack alignment={align} spacing={4} modifiers={[frame({maxWidth: 10000, maxHeight: 10000, alignment: align}), padding({all: 16})]}>
      <Text modifiers={[font({size: 11, weight: "medium"}), foregroundStyle(accent), lineLimit(1), minimumScaleFactor(.8)]}>{props?.label ?? "PrayerTime"}</Text>
      <Text modifiers={[font({size: small ? Math.min(24, 23 * scale) : 27 * scale, weight: "bold"}), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.65)]}>{props?.prayer ?? "Open PrayerTime"}</Text>
      {props?.time ? <Text modifiers={[font({size: small ? Math.min(30, 28 * scale) : 32 * scale, weight: "semibold"}), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.65)]}>{props.time}</Text> : null}
      <Spacer minLength={4} />
      {!small || props?.empty ? <Text modifiers={[font({size: 10}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.8)]}>{props?.date ?? ""}</Text> : null}
      {!small || scale <= 1.05 ? <Text modifiers={[font({size: 10}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.8)]}>{props?.location ?? ""}</Text> : null}
    </VStack>
  </ZStack>;
}
export default createWidget("NextPrayer", NextPrayerWidget);
