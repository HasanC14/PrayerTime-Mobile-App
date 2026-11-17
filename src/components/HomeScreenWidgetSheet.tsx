import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useI18n } from "../i18n/context";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { WidgetThumbnail } from "./WidgetThumbnail";
import { AppButton } from "./ui";
import { createThemedStyles, radii } from "../theme";
import { calculatePrayerCalendar } from "../services/prayerTimes";
import { REMINDER_CALENDAR_DAYS } from "../services/reminderWindow";
import { buildHomeWidgetTimeline, selectWidgetEntry, HOME_WIDGET_OPTIONS, type HomeWidgetKind, type PrayerWidgetEntry } from "../services/widgetTimeline";
import { isHomeScreenWidgetAvailable, requestHomeScreenWidget } from "../services/homeScreenWidget";
import { syncHomeScreenWidget } from "../services/syncHomeScreenWidget";
import type { AppLocation, AppSettings } from "../types";
import { selectionFeedback } from "../utils/feedback";

const IOS_GUIDE = "Touch and hold your home screen, tap Edit, then Add Widget. Search for PrayerTime and choose a widget style.";

export function HomeScreenWidgetSheet({ visible, onClose, location, settings }: {
  visible: boolean; onClose: () => void; location: AppLocation | null; settings: AppSettings;
}) {
  const { styles } = useStyles();
  const {width, fontScale} = useWindowDimensions();
  const singleColumn = width < 360 || Math.max(fontScale, settings.textScale) > 1.3;
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState<HomeWidgetKind | null>(null);
  const [selected, setSelected] = useState<HomeWidgetKind>("hero");
  const busyRef = useRef(false);
  const [message, setMessage] = useState<{ kind: HomeWidgetKind; text: string } | null>(null);
  const [previewEntries, setPreviewEntries] = useState<PrayerWidgetEntry[] | null>(null);
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => {
      const now = new Date();
      try {
        const calendar = location ? calculatePrayerCalendar(location, settings, now, 1, REMINDER_CALENDAR_DAYS) : [];
        setPreviewEntries(buildHomeWidgetTimeline(calendar, location, settings, now));
      } catch {setPreviewEntries(null);}
      setClock(now.getTime());
    });
    return () => cancelAnimationFrame(frame);
  }, [location, settings, visible]);
  const preview = previewEntries ? selectWidgetEntry(previewEntries, clock) : null;
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
  const selectedOption = HOME_WIDGET_OPTIONS.find(option => option.id === selected)!;
  return <BottomSheetModal visible={visible} closeLabel="Close widgets" onClose={onClose} sheetStyle={styles.sheet}>
    <SheetHeader title="Home screen widgets" onClose={onClose} />
    <ScrollView style={{flexShrink: 1}} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.body}>Choose a widget for your home screen.</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={t("Widget style")} style={styles.choices}>
        {HOME_WIDGET_OPTIONS.map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.title}
          accessibilityState={{selected: option.id === selected, checked: option.id === selected, disabled: busy !== null}}
          disabled={busy !== null} testID={`widget-option-${option.id}`} onPress={() => {selectionFeedback(); setSelected(option.id); setMessage(null);}}
          style={({pressed}) => [styles.choice, singleColumn && styles.singleChoice, selected === option.id && styles.choiceSelected, pressed && {opacity: .7}]}>
          <View style={styles.sample}><WidgetThumbnail kind={option.id} preview={preview} now={clock} /></View>
          <View style={styles.caption}>
            <Text style={[styles.choiceText, selected === option.id && styles.choiceTextSelected]}>{option.title}</Text>
            <Ionicons name={selected === option.id ? "checkmark-circle" : "ellipse-outline"} size={20}
              color={selected === option.id ? styles.choiceTextSelected.color : styles.choiceText.color} />
          </View>
        </Pressable>)}
      </View>
      {message?.kind === selected ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message.text}</Text> : null}
    </ScrollView>
    <View style={[styles.actions, {paddingBottom: Math.max(insets.bottom, 20)}]}>
      <AppButton label={Platform.OS === "ios" ? "How to add" : "Add widget"} icon={Platform.OS === "ios" ? "information-circle-outline" : "add"}
        accessibilityLabel={Platform.OS === "ios" ? "How to add" : t("Add {widget}", {widget: t(selectedOption.title)})}
        loading={busy !== null} onPress={() => void addWidget(selected)} />
    </View>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "92%", backgroundColor: colors.surface, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingHorizontal: 20 },
  content: { gap: 14, paddingBottom: 12 },
  body: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 13, lineHeight: 20 },
  choices: {flexDirection: "row", flexWrap: "wrap", gap: 10},
  choice: {flexBasis: "46%", flexGrow: 1, maxWidth: "50%", padding: 6, gap: 10, borderRadius: 18, borderWidth: 1, borderColor: colors.border},
  singleChoice: {flexBasis: "100%", maxWidth: "100%"},
  sample: {backgroundColor: colors.background, borderRadius: 12, overflow: "hidden"},
  caption: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, paddingHorizontal: 6, paddingBottom: 6},
  choiceSelected: {backgroundColor: colors.selectedSurface, borderColor: colors.accent},
  choiceText: {flexShrink: 1, color: colors.inkSoft, fontFamily: "BricolageGrotesque_500Medium", fontSize: 14},
  choiceTextSelected: {color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold"},
  actions: {paddingTop: 12},
  notice: { fontFamily: "BricolageGrotesque_500Medium", color: colors.accent, fontSize: 13, lineHeight: 20, backgroundColor: colors.selectedSurface, borderRadius: 14, padding: 14 }
}));
