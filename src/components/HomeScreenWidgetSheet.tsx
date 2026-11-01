import { useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { TextScaleProvider } from "../typography";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { AppButton } from "./ui";
import { HeroArtwork } from "./HeroArtwork";
import { PrayerHeroCard } from "./PrayerHeroCard";
import { getProgressBetween } from "../utils/time";
import { createThemedStyles, radii } from "../theme";
import { calculatePrayerCalendar } from "../services/prayerTimes";
import { REMINDER_CALENDAR_DAYS } from "../services/reminderWindow";
import { buildHomeWidgetTimeline, HOME_WIDGET_OPTIONS, type HomeWidgetKind, type PrayerWidgetProps } from "../services/widgetTimeline";
import { isHomeScreenWidgetAvailable, requestHomeScreenWidget } from "../services/homeScreenWidget";
import { syncHomeScreenWidget } from "../services/syncHomeScreenWidget";
import type { AppLocation, AppSettings } from "../types";

const IOS_GUIDE = "Touch and hold your home screen, tap Edit, then Add Widget. Search for PrayerTime and choose a widget style.";

function WidgetPreview({ kind, preview, settings, location }: { kind: HomeWidgetKind; preview: PrayerWidgetProps | null; settings: AppSettings; location: AppLocation | null }) {
  const { styles } = useStyles();
  const { t } = useI18n();
  const summary = preview?.summary;
  const hero = preview?.hero;
  if (kind === "hero" && hero) {
    const now = new Date();
    return <View accessible accessibilityLabel={`${t("Widget preview")} · ${t("Prayer card")}`}>
      <PrayerHeroCard focus={{ prayer: hero.focusPrayer, phase: hero.phase, windowStart: new Date(hero.start), target: new Date(hero.target), progress: 0, startLabel: hero.focusPrayer }}
        remaining={Math.max(0, hero.target - now.getTime())} progress={getProgressBetween(new Date(hero.start), new Date(hero.target), now)}
        guidance={hero.danger ? { key: "sunrise", title: "Prohibited time", message: "", start: new Date(hero.start), end: new Date(hero.target) } : null}
        next={hero.nextPrayer && hero.nextTimestamp ? { name: hero.nextPrayer, date: new Date(hero.nextTimestamp) } : null}
        timeFormat={settings.timeFormat} timeZone={location?.timeZone ?? "UTC"} artwork={settings.heroArtwork} />
    </View>;
  }
  return <View style={[styles.preview, kind === "next" && styles.compact]} accessible accessibilityLabel={`${t("Widget preview")} · ${t(HOME_WIDGET_OPTIONS.find(item => item.id === kind)!.title)}`}>
    {preview && !preview.empty ? <View style={styles.artwork}><HeroArtwork artwork={settings.heroArtwork} /></View> : null}
    {kind === "next" || !summary ? <>
      <Text style={styles.label}>{preview?.label ?? "PrayerTime"}</Text>
      <Text style={styles.prayer}>{preview?.prayer ?? "Refresh prayer times"}</Text>
      {preview?.time ? <Text style={styles.time}>{preview.time}</Text> : null}
      <Text style={styles.detail}>{preview?.date ?? ""}</Text>
    </> : <>
      <Text style={styles.label}>{summary.hijri}</Text>
      <Text style={styles.detail}>{summary.date}</Text>
      {kind === "summary" ? <>
        <Text style={[styles.label, { marginTop: 10 }]}>{summary.label}</Text>
        <Text style={styles.prayer}>{summary.prayer}</Text>
        <Text style={styles.range}>{summary.range}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.detail}>{summary.sunriseLabel}</Text><Text style={styles.statValue}>{summary.sunrise}</Text></View>
          <View style={styles.stat}><Text style={styles.detail}>{summary.sunsetLabel}</Text><Text style={styles.statValue}>{summary.sunset}</Text></View>
          {summary.sehri ? <View style={styles.stat}><Text style={styles.detail}>{summary.sehriLabel}</Text><Text style={styles.statValue}>{summary.sehri}</Text></View> : null}
          {summary.iftar ? <View style={styles.stat}><Text style={styles.detail}>{summary.iftarLabel}</Text><Text style={styles.statValue}>{summary.iftar}</Text></View> : null}
        </View>
      </> : summary.rows.map(row => <View key={row.name} style={[styles.prayerRow, row.active && styles.activeRow]}>
        <Text style={[styles.rowName, row.active && styles.activeText]}>{row.name}</Text>
        <Text style={styles.rowTime}>{row.time}</Text>
      </View>)}
    </>}
    <Text numberOfLines={2} style={styles.detail}>{preview?.location ?? "PrayerTime"}</Text>
  </View>;
}

export function HomeScreenWidgetSheet({ visible, onClose, location, settings }: {
  visible: boolean; onClose: () => void; location: AppLocation | null; settings: AppSettings;
}) {
  const { styles } = useStyles();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<HomeWidgetKind | null>(null);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<{ kind: HomeWidgetKind; text: string } | null>(null);
  const preview = useMemo(() => {
    try {
      const now = new Date();
      const calendar = visible && location ? calculatePrayerCalendar(location, settings, now, 1, REMINDER_CALENDAR_DAYS) : [];
      return buildHomeWidgetTimeline(calendar, location, settings, now)[0].props;
    } catch { return null; }
  }, [location, settings, visible]);
  async function addWidget(kind: HomeWidgetKind) {
    if (busyRef.current) return;
    const show = (text: string) => setMessage({ kind, text });
    if (!location) { show("Choose your location in Settings first."); return; }
    if (Platform.OS === "web") { show("Widgets are available in the installed Android and iPhone apps."); return; }
    if (!isHomeScreenWidgetAvailable()) { show("Widgets need the latest installed app build. They aren't available in Expo Go."); return; }
    busyRef.current = true;
    setBusy(kind);
    setMessage(null);
    try {
      const now = new Date();
      const calendar = calculatePrayerCalendar(location, settings, now, 1, REMINDER_CALENDAR_DAYS);
      await syncHomeScreenWidget(buildHomeWidgetTimeline(calendar, location, settings, now));
      if (Platform.OS === "ios") { show(IOS_GUIDE); return; }
      const requested = await requestHomeScreenWidget(kind);
      show(requested ? "Complete the request on your home screen to add the widget." : "Touch and hold your home screen, choose Widgets, then find PrayerTime.");
    } catch { show("Couldn't prepare the widget. Please try again."); }
    finally { busyRef.current = false; setBusy(null); }
  }
  return <BottomSheetModal visible={visible} closeLabel="Close widgets" onClose={onClose} sheetStyle={styles.sheet}>
    <SheetHeader title="Home screen widgets" onClose={onClose} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <Text style={styles.body}>Choose a widget for your home screen. Tap any widget to open PrayerTime.</Text>
      <Text style={styles.body}>Uses your prayer card artwork. Change it in Settings → Prayer card artwork.</Text>
      {Platform.OS === "ios" ? <Text style={styles.notice}>{IOS_GUIDE}</Text> : null}
      {HOME_WIDGET_OPTIONS.map(option => <View key={option.id} style={styles.option} testID={`widget-option-${option.id}`}>
        <TextScaleProvider value={Math.min(settings.textScale, 1.2)}><WidgetPreview kind={option.id} preview={preview} settings={settings} location={location} /></TextScaleProvider>
        <View style={styles.optionHeading}>
          <View style={styles.copy}><Text style={styles.heading}>{option.title}</Text><Text style={styles.size}>{option.size}</Text></View>
          <AppButton label="Add" accessibilityLabel={t("Add {widget}", { widget: t(option.title) })} loading={busy === option.id} disabled={busy !== null} onPress={() => void addWidget(option.id)} style={styles.add} />
        </View>
        <Text style={styles.body}>{option.description}</Text>
        {message?.kind === option.id ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message.text}</Text> : null}
      </View>)}
      <Text style={styles.body}>Works offline with your saved location. Opening PrayerTime refreshes the next two weeks and applies location, language, time format, and calculation changes.</Text>
      <Text style={styles.body}>Your phone controls widget refresh timing. Open PrayerTime after travelling to update your location.</Text>
      <AppButton label="Done" variant="secondary" onPress={onClose} />
    </ScrollView>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingHorizontal: 20 },
  content: { gap: 18 },
  body: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 13, lineHeight: 20 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 14, gap: 12 },
  preview: { backgroundColor: colors.heroStart, borderRadius: 20, padding: 16, gap: 5, overflow: "hidden" },
  artwork: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: 0.65 },
  compact: { maxWidth: 260, width: "100%", alignSelf: "center" },
  label: { fontFamily: "BricolageGrotesque_600SemiBold", color: colors.accent, fontSize: 12 },
  prayer: { fontFamily: "BricolageGrotesque_700Bold", color: colors.ink, fontSize: 24, lineHeight: 34 },
  time: { fontFamily: "BricolageGrotesque_700Bold", color: colors.ink, fontSize: 28, lineHeight: 39 },
  range: { fontFamily: "BricolageGrotesque_600SemiBold", color: colors.ink, fontSize: 15, lineHeight: 23 },
  detail: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 11, lineHeight: 17 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 8 },
  stat: { minWidth: "44%", flexGrow: 1, gap: 3 },
  statValue: { fontFamily: "BricolageGrotesque_600SemiBold", color: colors.ink, fontSize: 12 },
  prayerRow: { paddingVertical: 7, paddingHorizontal: 6, borderRadius: 8, gap: 3 },
  activeRow: { backgroundColor: colors.surface },
  activeText: { color: colors.accent },
  rowName: { fontFamily: "BricolageGrotesque_600SemiBold", color: colors.ink, fontSize: 12 },
  rowTime: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 12 },
  optionHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  heading: { fontFamily: "BricolageGrotesque_600SemiBold", color: colors.ink, fontSize: 17 },
  size: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 11 },
  add: { minWidth: 72 },
  notice: { fontFamily: "BricolageGrotesque_500Medium", color: colors.accent, fontSize: 13, lineHeight: 20, backgroundColor: colors.selectedSurface, borderRadius: 14, padding: 14 }
}));
