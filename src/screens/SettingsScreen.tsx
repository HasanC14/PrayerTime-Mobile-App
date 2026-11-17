import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Pressable, Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useI18n } from "../i18n/context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextSizeSheet } from "../components/TextSizeSheet";
import { CoffeeSupportIcon } from "../components/CoffeeSupportIcon";
import { PillSwitch } from "../components/PillSwitch";
import { HeroArtworkSheet } from "../components/HeroArtworkSheet";
import { HomeScreenWidgetSheet } from "../components/HomeScreenWidgetSheet";
import { AppearanceSheet } from "../components/AppearanceSheet";
import { HERO_ARTWORK_OPTIONS } from "../constants/heroArtwork";
import { AlarmTimingSheet } from "../components/AlarmTimingSheet";
import { LocationSheet, type LocationSheetProps } from "../components/LocationSheet";
import { NotificationControls, type NotificationControlProps } from "../components/NotificationControls";
import {SavedRecordsSheet} from "../components/SavedRecordsSheet";
import { PrivacySheet } from "../components/PrivacySheet";
import { SelectionSheet } from "../components/SelectionSheet";
import { IconButton, RowDivider, ScreenHeader, SectionTitle, SettingRow, SettingsGroup } from "../components/ui";
import { ASR_METHODS, CALCULATION_METHODS, DEFAULT_SETTINGS, HIGH_LATITUDE_RULES, MIDNIGHT_MODES, RAMADAN_OPTIONS, THEME_OPTIONS } from "../constants/settings";
import { createThemedStyles } from "../theme";
import type { AppSettings } from "../types";
import { languageOptions } from "../i18n/translate";

type Picker = "method" | "school" | "midnight" | "latitude" | "ramadan" | "theme" | "time" | "language" | "artwork" | "hijri" | null;
export type SettingsSection = "location" | "alarms";

type SettingsProps = LocationSheetProps & {
  settings: AppSettings;
  notificationControls: NotificationControlProps;
  onUpdateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
  onSetAlarmLeadMinutes: (minutes: number) => Promise<void>;
  focusRequest?: { section: SettingsSection; requestId: number };
  onBack?: () => void;
};

const HIJRI_OPTIONS = [-2, -1, 0, 1, 2].map(days => ({id: days, name: days === 0 ? "No adjustment" : `${days > 0 ? "+" : ""}${days} ${Math.abs(days) === 1 ? "day" : "days"}`}));

const TIME_OPTIONS = [
  { id: "12h", name: "12-hour", description: "Times with AM and PM, like 5:30 PM." },
  { id: "24h", name: "24-hour", description: "Times from 00:00 to 23:59, like 17:30." }
] as const;

const DONATION_URL = process.env.EXPO_PUBLIC_DONATION_URL?.trim() || "https://www.supportkori.com/devhasan";

export function SettingsScreen({ settings, notificationControls, onUpdateSetting, onSetAlarmLeadMinutes, focusRequest, onBack, ...locationProps }: SettingsProps) {
  const { colors, styles } = useStyles();
  const { t } = useI18n();
  const [creditBeforeHeart, creditAfterHeart] = t("Made with {heart} by Hasan", {heart: "|"}).split("|");
  const creditText = (value: string) => <Text style={styles.credit} localize={false}>
    {value.trim().split(/(Hasan)/).map((part, index) => part === "Hasan"
      ? <Text key={index} localize={false} style={[styles.credit, styles.creatorName]}>Hasan</Text>
      : part)}
  </Text>;
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState<Picker>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openPicker = (next: Exclude<Picker, null>) => {setPicker(next); setPickerOpen(true);};
  // Retain the selected list throughout the sheet's exit animation.
  const closePicker = () => setPickerOpen(false);
  const [locationOpen, setLocationOpen] = useState(!locationProps.location);
  const [alarmTimingOpen, setAlarmTimingOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [widgetsOpen, setWidgetsOpen] = useState(false);
  const [textSizeOpen, setTextSizeOpen] = useState(false);
  const focusSection = focusRequest?.section;
  const focusId = focusRequest?.requestId;

  useEffect(() => {
    if (!focusSection || !focusId) return;
    const timer = setTimeout(() => {
      if (focusSection === "location") setLocationOpen(true);
      else setAlarmTimingOpen(true);
    }, 80);
    return () => clearTimeout(timer);
  }, [focusId, focusSection]);

  const method = CALCULATION_METHODS.find(item => item.id === settings.method)?.name ?? "Automatic";
  const school = ASR_METHODS.find(item => item.id === settings.school)?.name ?? "Hanafi";
  const midnight = MIDNIGHT_MODES.find(item => item.id === settings.midnightMode)?.name ?? "Standard";
  const latitude = HIGH_LATITUDE_RULES.find(item => item.id === settings.latitudeAdjustmentMethod)?.name ?? "Angle based";
  const ramadan = RAMADAN_OPTIONS.find(item => item.id === settings.ramadanMode)?.name ?? "Automatic";
  const theme = THEME_OPTIONS.find(item => item.id === settings.themeMode)?.name ?? "System";
  const artwork = HERO_ARTWORK_OPTIONS.find(item => item.id === settings.heroArtwork)
    ?? HERO_ARTWORK_OPTIONS.find(item => item.id === DEFAULT_SETTINGS.heroArtwork)!;
  const activePicker = picker === "hijri" ? {title: "Hijri date adjustment", options: HIJRI_OPTIONS, value: settings.hijriAdjustmentDays, key: "hijriAdjustmentDays" as const}
    : picker === "language" ? { title: "Language", options: languageOptions, value: settings.language, key: "language" as const }
    : picker === "method" ? { title: "Calculation method", options: CALCULATION_METHODS, value: settings.method, key: "method" as const }
    : picker === "school" ? { title: "Asr method", options: ASR_METHODS, value: settings.school, key: "school" as const }
    : picker === "midnight" ? { title: "Islamic midnight", options: MIDNIGHT_MODES, value: settings.midnightMode, key: "midnightMode" as const }
    : picker === "latitude" ? { title: "High-latitude rule", options: HIGH_LATITUDE_RULES, value: settings.latitudeAdjustmentMethod, key: "latitudeAdjustmentMethod" as const }
    : picker === "ramadan" ? { title: "Ramadan card", options: RAMADAN_OPTIONS, value: settings.ramadanMode, key: "ramadanMode" as const }
    : picker === "time" ? { title: "Time format", options: TIME_OPTIONS, value: settings.timeFormat, key: "timeFormat" as const }
    : { title: "Appearance", options: THEME_OPTIONS, value: settings.themeMode, key: "themeMode" as const };

  return <View style={styles.screen}>
    <ScreenHeader title="Settings" leading={onBack ? <IconButton icon="arrow-back" label="Back" onPress={onBack} /> : undefined} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
      <View style={styles.page}>
        <SectionTitle>Location</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="location-outline" title={locationProps.location?.name || "Choose your location"} subtitle={locationProps.locating ? "Finding your location…" : locationProps.location ? undefined : "Use your phone or choose a city"} onPress={() => setLocationOpen(true)} />
        </SettingsGroup>
        <SectionTitle>Prayer reminders</SectionTitle>
        <SettingsGroup>
          <NotificationControls {...notificationControls} timeZone={locationProps.location?.timeZone} />
          <RowDivider />
          <SettingRow icon="timer-outline" title="Reminder timing" value={`${settings.alarmLeadMinutes} min`} onPress={() => setAlarmTimingOpen(true)} />
        </SettingsGroup>
        <SectionTitle>Prayer journal</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="checkmark-circle-outline" title="Prayer tracking" trailing={<PillSwitch label="Prayer tracking" value={settings.prayerTrackingEnabled} onValueChange={value => onUpdateSetting("prayerTrackingEnabled", value)} />} />
          <RowDivider />
          <SettingRow icon="archive-outline" title="Saved records" subtitle="Backup and recovery" onPress={() => setRecordsOpen(true)} />
        </SettingsGroup>
        <Text style={styles.footnote}>Turning tracking off keeps your records. Uninstalling the app removes them.</Text>
        <SectionTitle>Display</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="language-outline" title="Language" value={languageOptions.find(option => option.id === settings.language)?.name} onPress={() => openPicker("language")} />
          <RowDivider />
          <SettingRow icon="color-palette-outline" title="Appearance" value={theme} onPress={() => openPicker("theme")} />
          <RowDivider />
          <SettingRow icon="image-outline" title="Prayer card artwork" value={artwork.name} onPress={() => openPicker("artwork")} />
          <RowDivider />
          <SettingRow icon="grid-outline" title="Home screen widgets" onPress={() => setWidgetsOpen(true)} />
          <RowDivider />
          <SettingRow icon="text-outline" title="Text size" value={`${Math.round(settings.textScale * 100)}%`} onPress={() => setTextSizeOpen(true)} />
          <RowDivider />
          <SettingRow icon="time-outline" title="Time format" value={settings.timeFormat === "24h" ? "24-hour" : "12-hour"} onPress={() => openPicker("time")} />
          <RowDivider />
          <SettingRow icon="calendar-outline" title="Hijri date adjustment" value={HIJRI_OPTIONS.find(option => option.id === settings.hijriAdjustmentDays)?.name} onPress={() => openPicker("hijri")} />
          <RowDivider />
          <SettingRow icon="moon-outline" title="Ramadan card" value={ramadan} onPress={() => openPicker("ramadan")} />
        </SettingsGroup>
        <SectionTitle>Prayer calculation</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="calculator-outline" title="Calculation method" value={method} onPress={() => openPicker("method")} />
          <RowDivider />
          <SettingRow icon="sunny-outline" title="Asr method" value={school} onPress={() => openPicker("school")} />
          <RowDivider />
          <SettingRow icon="earth-outline" title="High-latitude rule" value={latitude} onPress={() => openPicker("latitude")} />
          <RowDivider />
          <SettingRow icon="contrast-outline" title="Islamic midnight" value={midnight} onPress={() => openPicker("midnight")} />
        </SettingsGroup>
        <Text style={styles.footnote}>Automatic uses a calculation method suited to your country.</Text>
        <SectionTitle>About</SectionTitle>
        <SettingsGroup><SettingRow icon="shield-checkmark-outline" title="Location & privacy" onPress={() => setPrivacyOpen(true)} /></SettingsGroup>
        <View style={styles.footer}>
          <Text style={styles.brand}>PrayerTime</Text>
          <View style={styles.footerActions} testID="settings-footer-links">
            <Pressable accessibilityRole="link" accessibilityLabel="Made with love by Hasan" accessibilityHint="Opens hasanbuilds.com"
              onPress={() => void Linking.openURL("https://hasanbuilds.com").catch(() => undefined)}
              style={({pressed}) => [styles.footerLink, pressed && {opacity: .65}]}>
              {creditText(creditBeforeHeart)}
              <Ionicons name="heart-outline" size={13} color={colors.accent} />
              {creditText(creditAfterHeart)}
            </Pressable>
            <Text accessible={false} importantForAccessibility="no" style={styles.separator} localize={false}>·</Text>
            <Pressable accessibilityRole="link" accessibilityLabel="Support PrayerTime" accessibilityHint="Opens the donation page"
              onPress={() => void Linking.openURL(DONATION_URL).catch(() => undefined)}
              style={({pressed}) => [styles.footerLink, pressed && {opacity: .65}]}>
              <CoffeeSupportIcon size={17} primaryColor={colors.accent} accentColor={colors.accentSurface} />
              <Text style={styles.donation}>Support PrayerTime</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
    <LocationSheet {...locationProps} visible={locationOpen} onClose={() => setLocationOpen(false)} />
    <HeroArtworkSheet visible={pickerOpen && picker === "artwork"} value={settings.heroArtwork} onSelect={value => onUpdateSetting("heroArtwork", value)} onClose={closePicker} />
    <AppearanceSheet visible={pickerOpen && picker === "theme"} value={settings.themeMode} artwork={settings.heroArtwork} onSelect={value => onUpdateSetting("themeMode", value)} onClose={closePicker} />
    <SelectionSheet visible={pickerOpen && picker !== null && picker !== "artwork" && picker !== "theme"} title={activePicker.title} options={activePicker.options} value={activePicker.value} onSelect={value => {
      // Each option list above is paired with its matching settings key.
      onUpdateSetting(activePicker.key, value as AppSettings[typeof activePicker.key]);
    }} onClose={closePicker} />
    <AlarmTimingSheet value={settings.alarmLeadMinutes} visible={alarmTimingOpen} onSave={onSetAlarmLeadMinutes} onClose={() => setAlarmTimingOpen(false)} />
    <TextSizeSheet visible={textSizeOpen} value={settings.textScale} onChange={value => onUpdateSetting("textScale", value)} onClose={() => setTextSizeOpen(false)} />
    <SavedRecordsSheet visible={recordsOpen} onClose={() => setRecordsOpen(false)} />
    <PrivacySheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    <HomeScreenWidgetSheet visible={widgetsOpen} onClose={() => setWidgetsOpen(false)} location={locationProps.location} settings={settings} />
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  page: { alignSelf: "center", width: "100%", maxWidth: 620 },
  footnote: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 12, lineHeight: 18, paddingHorizontal: 12, paddingTop: 10 },
  footer: { alignItems: "center", paddingTop: 32, gap: 2 },
  brand: { fontFamily: "BricolageGrotesque_700Bold", color: colors.inkSoft, fontSize: 15 },
  footerActions: {width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: 6},
  footerLink: {minHeight: 44, paddingVertical: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4},
  credit: {fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 11, textAlign: "center"},
  creatorName: {textDecorationLine: "underline", color: colors.accent},
  donation: {fontFamily: "BricolageGrotesque_500Medium", color: colors.accent, fontSize: 11, textAlign: "center"},
  separator: {fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 12},
}));
