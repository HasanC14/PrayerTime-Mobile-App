import { HStack, Image, Rectangle, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import { accessibilityElement, accessibilityLabel, aspectRatio, background, clipped, containerBackground, environment as environmentValue, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, opacity, padding, resizable, scaleEffect, shapes, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { PrayerWidgetProps } from "../services/widgetTimeline";

function DaySummaryLayout(props: PrayerWidgetProps, environment: WidgetEnvironment) {
  "widget";
  const palette = props?.appearance?.followsSystem && environment.colorScheme === "dark" ? props.appearance.dark : props?.appearance?.light;
  const classic = props?.theme === "classic-dark";
  const dark = palette?.dark ?? (classic || props?.theme === "dark" || props?.theme === "midnight-blue" || ((!props?.theme || props.theme === "system") && environment.colorScheme === "dark"));
  const ink = palette?.ink ?? (dark ? "#EEEAF2" : "#24143A");
  const accent = palette?.accent ?? (dark ? "#C0ACD7" : "#6F4B94");
  const muted = palette?.muted ?? (dark ? "#BBB5C4" : "#746A7D");
  const surface = palette?.surface ?? (dark ? "#222329" : "#FFFFFF");
  const start = palette?.detailStart ?? surface;
  const end = palette?.detailEnd ?? surface;
  const line = palette?.line ?? (dark ? "#34343E" : "#ECE5F1");
  const scale = Math.max(.9, Math.min(props?.textScale ?? 1, 1.2));
  const align = props?.isRTL ? "trailing" : "leading";
  const summary = props?.summary;
  return <ZStack alignment="topTrailing" modifiers={[frame({maxWidth: 10000, maxHeight: 10000}), clipped(),
    containerBackground({type: "linearGradient", colors: [start, end], startPoint: {x: 0, y: 0}, endPoint: {x: 1, y: 1}}, "widget"), widgetURL("prayertime://prayer"), environmentValue("locale", props?.language === "bn" ? "bn_BD" : props?.language === "ar" || props?.isRTL ? "ar" : "en_US")]}>
    {props?.artworkUri && !props?.empty ? <Image uiImage={props.artworkUri} modifiers={[resizable(), aspectRatio({contentMode: "fill"}), frame({maxWidth: 10000, maxHeight: 10000, alignment: "topTrailing"}), clipped(), opacity(palette?.detailArtworkOpacity ?? (dark ? .34 : .55)), scaleEffect({x: props.isRTL ? -1 : 1, y: 1})]} /> : null}
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [start + "F2", start + "A6", start + "00"], startPoint: {x: props?.isRTL ? 1 : 0, y: 0}, endPoint: {x: props?.isRTL ? 0 : 1, y: 0}})]} />
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [end + "00", end + "00", end + "E6"], startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 1}})]} />
    <VStack alignment={align} spacing={8} modifiers={[frame({maxWidth: 10000, maxHeight: 10000, alignment: align}), padding({all: 16})]}>
      <Text modifiers={[font({size: 11, weight: "semibold"}), foregroundStyle(accent), lineLimit(1), minimumScaleFactor(.8)]}>{summary?.hijri ?? "PrayerTime"}</Text>
      <Spacer minLength={0} />
      <HStack alignment="center" spacing={14}>
        {(props?.isRTL ? ["stats", "divider", "prayer"] : ["prayer", "divider", "stats"]).map(part => part === "divider"
          ? <Rectangle key={part} modifiers={[frame({width: 1, height: 64}), foregroundStyle(line)]} />
          : part === "prayer" ? <VStack key={part} alignment={align} spacing={3} modifiers={[frame({maxWidth: 10000, alignment: align})]}>
            <Text modifiers={[font({size: 10}), foregroundStyle(accent), lineLimit(1), minimumScaleFactor(.8)]}>{summary?.label ?? props?.label ?? ""}</Text>
            <Text modifiers={[font({size: 24 * scale, weight: "bold"}), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.65)]}>{summary?.prayer ?? props?.prayer ?? "Open PrayerTime"}</Text>
            <Text modifiers={[font({size: 11}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.65)]}>{summary?.range ?? ""}</Text>
          </VStack> : summary ? <VStack key={part} alignment={align} spacing={2} modifiers={[frame({width: 104, alignment: align})]}>
            <Text modifiers={[font({size: 10}), foregroundStyle(muted), lineLimit(1)]}>{summary.sehri ? summary.sehriLabel : summary.sunriseLabel}</Text>
            <Text modifiers={[font({size: 15 * scale, weight: "semibold"}), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.7)]}>{summary.sehri || summary.sunrise}</Text>
            <Text modifiers={[font({size: 10}), foregroundStyle(muted), padding({top: 6}), lineLimit(1)]}>{summary.iftar ? summary.iftarLabel : summary.sunsetLabel}</Text>
            <Text modifiers={[font({size: 15 * scale, weight: "semibold"}), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.7)]}>{summary.iftar || summary.sunset}</Text>
          </VStack> : null)}
      </HStack>
      <Spacer minLength={0} />
      <Text modifiers={[font({size: 10}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.75)]}>{summary?.date ?? props?.date ?? ""}</Text>
    </VStack>
  </ZStack>;
}

function PrayerTimesLayout(props: PrayerWidgetProps, environment: WidgetEnvironment) {
  "widget";
  const palette = props?.appearance?.followsSystem && environment.colorScheme === "dark" ? props.appearance.dark : props?.appearance?.light;
  const classic = props?.theme === "classic-dark";
  const dark = palette?.dark ?? (classic || props?.theme === "dark" || props?.theme === "midnight-blue" || ((!props?.theme || props.theme === "system") && environment.colorScheme === "dark"));
  const ink = palette?.ink ?? (dark ? "#EEEAF2" : "#24143A");
  const accent = palette?.accent ?? (dark ? "#C0ACD7" : "#6F4B94");
  const muted = palette?.muted ?? (dark ? "#BBB5C4" : "#746A7D");
  const surface = palette?.surface ?? (dark ? "#222329" : "#FFFFFF");
  const start = palette?.detailStart ?? surface;
  const end = palette?.detailEnd ?? surface;
  const highlight = palette?.highlight ?? (dark ? "#35303F" : "#F1E8F7");
  const scale = Math.max(.9, Math.min(props?.textScale ?? 1, 1.2));
  const align = props?.isRTL ? "trailing" : "leading";
  const summary = props?.summary;
  return <ZStack alignment="topTrailing" modifiers={[frame({maxWidth: 10000, maxHeight: 10000}), clipped(),
    containerBackground({type: "linearGradient", colors: [start, end], startPoint: {x: 0, y: 0}, endPoint: {x: 1, y: 1}}, "widget"), widgetURL("prayertime://prayer"), environmentValue("locale", props?.language === "bn" ? "bn_BD" : props?.language === "ar" || props?.isRTL ? "ar" : "en_US")]}>
    {props?.artworkUri && !props?.empty ? <Image uiImage={props.artworkUri} modifiers={[resizable(), aspectRatio({contentMode: "fill"}), frame({maxWidth: 10000, maxHeight: 10000, alignment: "topTrailing"}), clipped(), opacity(palette?.detailArtworkOpacity ?? (dark ? .34 : .55)), scaleEffect({x: props.isRTL ? -1 : 1, y: 1})]} /> : null}
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [start + "F2", start + "A6", start + "00"], startPoint: {x: props?.isRTL ? 1 : 0, y: 0}, endPoint: {x: props?.isRTL ? 0 : 1, y: 0}})]} />
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [end + "00", end + "00", end + "E6"], startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 1}})]} />
    <VStack alignment={align} spacing={8} modifiers={[frame({maxWidth: 10000, maxHeight: 10000, alignment: align}), padding({all: 16})]}>
      <Text modifiers={[font({size: 18, weight: "bold"}), foregroundStyle(ink), lineLimit(1)]}>{summary?.timesLabel ?? "PrayerTime"}</Text>
      <Text modifiers={[font({size: 11}), foregroundStyle(accent), lineLimit(1), minimumScaleFactor(.8)]}>{summary?.hijri ?? props?.date ?? ""}</Text>
      <Spacer minLength={0} />
      <VStack spacing={3} modifiers={[frame({maxWidth: 10000})]}>
        {summary?.rows.map((row, index) => <HStack key={index} spacing={8} modifiers={[accessibilityElement("ignore"), accessibilityLabel(row.name + ", " + row.time), padding({horizontal: 10, vertical: 7}), background(row.active ? highlight : "#00000000", shapes.roundedRectangle({cornerRadius: 12}))]}>
          {props?.isRTL ? <Text modifiers={[font({size: 14 * scale, weight: "semibold"}), monospacedDigit(), foregroundStyle(row.active ? accent : ink), lineLimit(1), minimumScaleFactor(.65)]}>{row.startTime ?? row.time}</Text> : null}
          {!props?.isRTL ? <Text modifiers={[font({size: 13 * scale, weight: row.active ? "bold" : "medium"}), foregroundStyle(row.active ? accent : ink), lineLimit(1), minimumScaleFactor(.8)]}>{row.name}</Text> : null}
          <Spacer minLength={8} />
          {props?.isRTL ? <Text modifiers={[font({size: 13 * scale, weight: row.active ? "bold" : "medium"}), foregroundStyle(row.active ? accent : ink), lineLimit(1), minimumScaleFactor(.8)]}>{row.name}</Text> : <Text modifiers={[font({size: 14 * scale, weight: "semibold"}), monospacedDigit(), foregroundStyle(row.active ? accent : ink), lineLimit(1), minimumScaleFactor(.65)]}>{row.startTime ?? row.time}</Text>}
        </HStack>)}
      </VStack>
      <Spacer minLength={0} />
      <Text modifiers={[font({size: 10}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.8)]}>{props?.location ?? ""}</Text>
    </VStack>
  </ZStack>;
}

export const daySummaryWidget = createWidget("DaySummary", DaySummaryLayout);
export const prayerTimesWidget = createWidget("PrayerTimes", PrayerTimesLayout);
