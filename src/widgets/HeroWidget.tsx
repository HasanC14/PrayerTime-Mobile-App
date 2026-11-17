import { HStack, Image, ProgressView, Rectangle, Spacer, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import { aspectRatio, clipped, containerBackground, environment as environmentValue, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, opacity, padding, progressViewStyle, resizable, scaleEffect, tint, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { PrayerWidgetProps } from "../services/widgetTimeline";

function HeroLayout(props: PrayerWidgetProps, environment: WidgetEnvironment) {
  "widget";
  const palette = props?.appearance?.followsSystem && environment.colorScheme === "dark" ? props.appearance.dark : props?.appearance?.light;
  const classic = props?.theme === "classic-dark";
  const dark = palette?.dark ?? (classic || props?.theme === "dark" || props?.theme === "midnight-blue" || ((!props?.theme || props.theme === "system") && environment.colorScheme === "dark"));
  const baseStart = palette?.start ?? (classic ? "#3C2850" : dark ? "#30303C" : "#E3D2F3");
  const baseEnd = palette?.end ?? (classic ? "#60417C" : dark ? "#414052" : "#C5A7E2");
  const baseInk = palette?.ink ?? (dark ? "#EEEAF2" : "#24143A");
  const accent = palette?.accent ?? (dark ? "#C0ACD7" : "#6F4B94");
  const scale = Math.max(.9, Math.min(props?.textScale ?? 1, 1.2));
  const align = props?.isRTL ? "trailing" : "leading";
  const hero = props?.hero;
  const start = hero?.danger ? palette?.dangerStart ?? (dark ? "#292930" : "#E7E4EA") : baseStart;
  const end = hero?.danger ? palette?.dangerEnd ?? (dark ? "#34323D" : "#D8D4DE") : baseEnd;
  const ink = hero?.danger ? palette?.dangerInk ?? (dark ? "#D9D2E2" : "#514C5B") : baseInk;
  const tone = hero?.danger ? ink : accent;
  const muted = hero?.danger ? ink : palette?.heroMuted ?? (dark ? "#CEC4DA" : "#503E5D");
  const track = (hero?.danger ? palette?.dangerTrack : palette?.track) ?? (dark ? "#696274" : "#AB8BC5");
  const window = hero?.phase === "starts" ? hero.targetLabel + " " + hero.targetTime : hero?.windowRange;
  return <ZStack alignment="topTrailing" modifiers={[frame({maxWidth: 10000, maxHeight: 10000}), clipped(),
    containerBackground({type: "linearGradient", colors: [start, end], startPoint: {x: 0, y: 0}, endPoint: {x: 1, y: 1}}, "widget"), widgetURL("prayertime://prayer"), environmentValue("locale", props?.language === "bn" ? "bn_BD" : props?.language === "ar" || props?.isRTL ? "ar" : "en_US")]}>
    {props?.artworkUri && !props?.empty && !hero?.danger ? <Image uiImage={props.artworkUri} modifiers={[resizable(), aspectRatio({contentMode: "fill"}), frame({maxWidth: 10000, maxHeight: 10000, alignment: "topTrailing"}), clipped(), opacity(palette?.artworkOpacity ?? (dark ? .3 : .85)), scaleEffect({x: props.isRTL ? -1 : 1, y: 1})]} /> : null}
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [start + "F2", start + "A6", start + "00"], startPoint: {x: props?.isRTL ? 1 : 0, y: 0}, endPoint: {x: props?.isRTL ? 0 : 1, y: 0}})]} />
    <Rectangle modifiers={[foregroundStyle({type: "linearGradient", colors: [end + "00", end + "00", end + "E6"], startPoint: {x: 0, y: 0}, endPoint: {x: 0, y: 1}})]} />
    <VStack alignment={align} spacing={4} modifiers={[frame({maxWidth: 10000, maxHeight: 10000, alignment: align}), padding({all: 16})]}>
      <HStack alignment="firstTextBaseline" spacing={6}>
        {props?.isRTL && hero ? <Text modifiers={[font({size: 11}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.8)]}>{hero.phaseLabel}</Text> : null}
        <Text modifiers={[font({size: Math.min(24, 22 * scale), weight: "bold"}), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.65)]}>{hero?.prayer ?? props?.prayer ?? "PrayerTime"}</Text>
        {!props?.isRTL && hero ? <Text modifiers={[font({size: 11}), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.8)]}>{hero.phaseLabel}</Text> : null}
      </HStack>
      {hero ? <Text timerInterval={{lower: new Date(hero.start), upper: new Date(hero.target)}} countsDown
        modifiers={[font({size: Math.min(40, 37 * scale), weight: "semibold"}), monospacedDigit(), foregroundStyle(ink), frame({maxWidth: 205, alignment: align}), lineLimit(1), minimumScaleFactor(.7)]} />
        : <Text modifiers={[font({size: 13}), foregroundStyle(ink), lineLimit(2)]}>{props?.date ?? "Open PrayerTime"}</Text>}
      {window && scale <= 1.05 ? <Text modifiers={[font({size: 10}), monospacedDigit(), foregroundStyle(muted), lineLimit(1), minimumScaleFactor(.7)]}>{window}</Text> : null}
      <Spacer minLength={0} />
      {hero ? <ZStack modifiers={[frame({height: 3}), clipped()]}>
        <Rectangle modifiers={[foregroundStyle(track), frame({height: 3})]} />
        <ProgressView timerInterval={{lower: new Date(hero.start), upper: new Date(hero.target)}} countsDown={false} modifiers={[progressViewStyle("linear"), tint(tone), scaleEffect({x: props?.isRTL ? -1 : 1, y: 1})]} />
      </ZStack> : null}
      {hero ? <HStack spacing={8}>
        {props?.isRTL ? <Text modifiers={[font({size: 12, weight: "semibold"}), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.8)]}>{hero.footerTime}</Text> : null}
        {props?.isRTL ? <Spacer minLength={4} /> : null}
        <Text modifiers={[font({size: 11}), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.75)]}>{hero.footerLabel}</Text>
        {!props?.isRTL ? <Spacer minLength={4} /> : null}
        {!props?.isRTL ? <Text modifiers={[font({size: 12, weight: "semibold"}), monospacedDigit(), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(.8)]}>{hero.footerTime}</Text> : null}
      </HStack> : null}
    </VStack>
  </ZStack>;
}
export default createWidget("PrayerHero", HeroLayout);
