import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../i18n/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TextSizeControl } from "../components/TextSizeControl";
import { AlarmTimingSheet } from "../components/AlarmTimingSheet";
import { LocationSheet, type LocationSheetProps } from "../components/LocationSheet";
import { NotificationControls, type NotificationControlProps } from "../components/NotificationControls";
import { PrivacySheet } from "../components/PrivacySheet";
import { SelectionSheet } from "../components/SelectionSheet";
import { IconButton, RowDivider, ScreenHeader, SectionTitle, SettingRow, SettingsGroup } from "../components/ui";
import { ASR_METHODS, CALCULATION_METHODS, HIGH_LATITUDE_RULES, MIDNIGHT_MODES, RAMADAN_OPTIONS, THEME_OPTIONS } from "../constants/settings";
import { createThemedStyles } from "../theme";
import type { AppSettings } from "../types";
import { languageOptions } from "../i18n/translate";
import appConfig from "../../app.json";

type Picker = "method" | "school" | "midnight" | "latitude" | "ramadan" | "theme" | "time" | "language" | null;
export type SettingsSection = "location" | "alarms";

type SettingsProps = LocationSheetProps & {
  settings: AppSettings;
  notificationControls: NotificationControlProps;
  onUpdateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
  onSetAlarmLeadMinutes: (minutes: number) => Promise<void>;
  focusRequest?: { section: SettingsSection; requestId: number };
  onBack?: () => void;
};

const TIME_OPTIONS = [
  { id: "12h", name: "12-hour", description: "Times with AM and PM, like 5:30 PM." },
  { id: "24h", name: "24-hour", description: "Times from 00:00 to 23:59, like 17:30." }
] as const;

export function SettingsScreen({ settings, notificationControls, onUpdateSetting, onSetAlarmLeadMinutes, focusRequest, onBack, ...locationProps }: SettingsProps) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState<Picker>(null);
  const [locationOpen, setLocationOpen] = useState(!locationProps.location);
  const [alarmTimingOpen, setAlarmTimingOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
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
  const activePicker = picker === "language" ? { title: "Language", options: languageOptions, value: settings.language, key: "language" as const }
    : picker === "method" ? { title: "Calculation method", options: CALCULATION_METHODS, value: settings.method, key: "method" as const }
    : picker === "school" ? { title: "Asr method", options: ASR_METHODS, value: settings.school, key: "school" as const }
    : picker === "midnight" ? { title: "Islamic midnight", options: MIDNIGHT_MODES, value: settings.midnightMode, key: "midnightMode" as const }
    : picker === "latitude" ? { title: "High-latitude rule", options: HIGH_LATITUDE_RULES, value: settings.latitudeAdjustmentMethod, key: "latitudeAdjustmentMethod" as const }
    : picker === "ramadan" ? { title: "Ramadan card", options: RAMADAN_OPTIONS, value: settings.ramadanMode, key: "ramadanMode" as const }
    : picker === "time" ? { title: "Time format", options: TIME_OPTIONS, value: settings.timeFormat, key: "timeFormat" as const }
    : { title: "Appearance", options: THEME_OPTIONS, value: settings.themeMode, key: "themeMode" as const };

  return <View style={styles.screen}>
    <ScreenHeader title="Settings" subtitle="A prayer routine that feels like yours" leading={onBack ? <IconButton icon="arrow-back" label="Back" onPress={onBack} /> : undefined} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
      <View style={styles.page}>
        <SectionTitle>Location</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="location-outline" title={locationProps.location?.name || "Choose your location"} subtitle={locationProps.locating ? "Finding your location…" : locationProps.location ? undefined : "Use your phone or choose a city"} onPress={() => setLocationOpen(true)} />
        </SettingsGroup>
        <SectionTitle>Prayer reminders</SectionTitle>
        <SettingsGroup>
          <NotificationControls {...notificationControls} />
          <RowDivider />
          <SettingRow icon="timer-outline" title="Reminder timing" value={`${settings.alarmLeadMinutes} min`} subtitle="Before the prayer period ends" onPress={() => setAlarmTimingOpen(true)} />
        </SettingsGroup>
        <SectionTitle>Display</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="language-outline" title="Language" value={languageOptions.find(option => option.id === settings.language)?.name} onPress={() => setPicker("language")} />
          <RowDivider />
          <SettingRow icon="color-palette-outline" title="Appearance" value={theme} onPress={() => setPicker("theme")} />
          <RowDivider />
          <TextSizeControl value={settings.textScale} onChange={value => onUpdateSetting("textScale", value)} />
          <RowDivider />
          <SettingRow icon="time-outline" title="Time format" value={settings.timeFormat === "24h" ? "24-hour" : "12-hour"} onPress={() => setPicker("time")} />
          <RowDivider />
          <SettingRow icon="moon-outline" title="Ramadan card" value={ramadan} onPress={() => setPicker("ramadan")} />
        </SettingsGroup>
        <SectionTitle>Prayer calculation</SectionTitle>
        <SettingsGroup>
          <SettingRow icon="calculator-outline" title="Calculation method" value={method} onPress={() => setPicker("method")} />
          <RowDivider />
          <SettingRow icon="sunny-outline" title="Asr method" value={school} onPress={() => setPicker("school")} />
          <RowDivider />
          <SettingRow icon="earth-outline" title="High-latitude rule" value={latitude} onPress={() => setPicker("latitude")} />
          <RowDivider />
          <SettingRow icon="contrast-outline" title="Islamic midnight" value={midnight} onPress={() => setPicker("midnight")} />
        </SettingsGroup>
        <Text style={styles.footnote}>Automatic uses a calculation method suited to your country.</Text>
        <SectionTitle>About</SectionTitle>
        <SettingsGroup><SettingRow icon="shield-checkmark-outline" title="Location & privacy" onPress={() => setPrivacyOpen(true)} /></SettingsGroup>
        <View style={styles.footer}>
          <Text style={styles.brand}>PrayerTime</Text>
          <Text style={styles.version}>Version {appConfig.expo.version} · Made for your daily rhythm</Text>
        </View>
      </View>
    </ScrollView>
    <LocationSheet {...locationProps} visible={locationOpen} onClose={() => setLocationOpen(false)} />
    <SelectionSheet visible={picker !== null} title={activePicker.title} options={activePicker.options} value={activePicker.value} onSelect={value => {
      // Each option list above is paired with its matching settings key.
      onUpdateSetting(activePicker.key, value as AppSettings[typeof activePicker.key]);
    }} onClose={() => setPicker(null)} />
    <AlarmTimingSheet value={settings.alarmLeadMinutes} visible={alarmTimingOpen} onSave={onSetAlarmLeadMinutes} onClose={() => setAlarmTimingOpen(false)} />
    <PrivacySheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  page: { alignSelf: "center", width: "100%", maxWidth: 620 },
  footnote: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 12, lineHeight: 18, paddingHorizontal: 12, paddingTop: 10 },
  footer: { alignItems: "center", paddingTop: 32, gap: 6 },
  brand: { fontFamily: "BricolageGrotesque_700Bold", color: colors.inkSoft, fontSize: 15 },
  version: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 11, textAlign: "center" },
}));
