import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlarmTimingSheet } from "../components/AlarmTimingSheet";
import { PrivacySheet } from "../components/PrivacySheet";
import { NotificationControls, type NotificationControlProps } from "../components/NotificationControls";
import { formatLocationAccuracy, locationSourceLabel } from "../utils/locationStatus";
import { SelectionSheet } from "../components/SelectionSheet";
import {
  AppButton,
  IconButton,
  SectionTitle,
  SegmentedControl,
  SettingRow,
  SurfaceCard,
} from "../components/ui";
import {
  ASR_METHODS,
  CALCULATION_METHODS,
  HIGH_LATITUDE_RULES,
  MIDNIGHT_MODES,
  RAMADAN_OPTIONS,
  THEME_OPTIONS,
} from "../constants/settings";
import { createThemedStyles, radii, spacing } from "../theme";
import type {
  AppLocation,
  AppSettings,
  LocationIssue,
  LocationSearchResult,
} from "../types";
import { formatRelativeLocationAge } from "../utils/time";

type Picker =
  | "method"
  | "school"
  | "midnight"
  | "latitude"
  | "ramadan"
  | "theme"
  | null;
export type SettingsSection = "location" | "alarms";

export function SettingsScreen({
  settings,
  location,
  recentLocations,
  locating,
  locationIssue,
  notificationControls,
  locationProgress,
  onUseCurrentLocation,
  onSearchLocations,
  onUseManualLocation,
  onUseRecentLocation,
  onOpenPhoneSettings,
  onUpdateSetting,
  onSetAlarmLeadMinutes,
  focusRequest,
  onBack,
}: {
  settings: AppSettings;
  location: AppLocation | null;
  recentLocations: AppLocation[];
  locating: boolean;
  locationIssue: LocationIssue | null;
  notificationControls: NotificationControlProps;
  locationProgress: string | null;
  onUseCurrentLocation: () => void;
  onSearchLocations: (query: string) => Promise<LocationSearchResult[]>;
  onUseManualLocation: (location: LocationSearchResult) => Promise<void>;
  onUseRecentLocation: (location: AppLocation) => Promise<void>;
  onOpenPhoneSettings: () => void;
  onUpdateSetting: <Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key],
  ) => void;
  onSetAlarmLeadMinutes: (minutes: number) => Promise<void>;
  focusRequest?: { section: SettingsSection; requestId: number };
  onBack?: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<SettingsSection, number>>({
    location: 0,
    alarms: 0,
  });
  const focusSection = focusRequest?.section;
  const focusRequestId = focusRequest?.requestId;
  const [picker, setPicker] = useState<Picker>(null);
  const [alarmTimingOpen, setAlarmTimingOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [applyingLocationId, setApplyingLocationId] = useState<string | null>(
    null,
  );
  const [locationQuery, setLocationQuery] = useState(location?.name ?? "");
  const [locationResults, setLocationResults] = useState<
    LocationSearchResult[]
  >([]);
  const [searchIssue, setSearchIssue] = useState<string | null>(null);
  const [previousLocation, setPreviousLocation] = useState(location);

  if (previousLocation !== location) {
    setPreviousLocation(location);
    setLocationQuery(location?.name ?? "");
    setLocationResults([]);
    setSearchIssue(null);
    setSearchingLocation(false);
  }

  useEffect(() => {
    if (!advancedOpen) return;
    const query = locationQuery.trim();
    const isCurrentLocation = query === location?.name;
    if (query.length < 2 || isCurrentLocation) {
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      if (!active) return;
      setSearchingLocation(true);
      void onSearchLocations(query)
        .then((results) => {
          if (!active) return;
          setLocationResults(results);
          setSearchIssue(null);
        })
        .catch((error) => {
          if (!active) return;
          console.warn("Unable to search for a location", error);
          setLocationResults([]);
          setSearchIssue(
            error instanceof Error
              ? error.message
              : "Location search failed. Please try again.",
          );
        })
        .finally(() => {
          if (active) setSearchingLocation(false);
        });
    }, 500);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [advancedOpen, location?.name, locationQuery, onSearchLocations]);

  useEffect(() => {
    if (!focusSection || !focusRequestId) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, sectionOffsets.current[focusSection] - spacing.md),
      });
    }, 60);
    return () => clearTimeout(timeout);
  }, [focusRequestId, focusSection]);

  const applyManualLocation = async (result: LocationSearchResult) => {
    setSearchIssue(null);
    setApplyingLocationId(result.id);
    try {
      await onUseManualLocation(result);
      setAdvancedOpen(false);
    } catch (error) {
      console.warn("Unable to apply manual location", error);
      setSearchIssue(
        "PrayerTime could not save this location. Please try again.",
      );
    } finally {
      setApplyingLocationId(null);
    }
  };

  const methodName =
    CALCULATION_METHODS.find((item) => item.id === settings.method)?.name ??
    "Automatic";
  const schoolName =
    ASR_METHODS.find((item) => item.id === settings.school)?.name ?? "Hanafi";
  const midnightName =
    MIDNIGHT_MODES.find((item) => item.id === settings.midnightMode)?.name ??
    "Standard";
  const latitudeName =
    HIGH_LATITUDE_RULES.find(
      (item) => item.id === settings.latitudeAdjustmentMethod,
    )?.name ?? "Angle based";
  const ramadanName =
    RAMADAN_OPTIONS.find((item) => item.id === settings.ramadanMode)?.name ??
    "Automatic";
  const themeName =
    THEME_OPTIONS.find((item) => item.id === settings.themeMode)?.name ??
    "System";
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, spacing.xl),
              paddingBottom: spacing.xxl,
            },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.header}>
              {onBack ? (
                <IconButton icon="arrow-back" label="Back" onPress={onBack} />
              ) : null}
              <View style={styles.headerCopy}>
                <Text accessibilityRole="header" style={styles.title}>
                  Settings
                </Text>
                <Text style={styles.subtitle}>Prayer, location and alarms</Text>
              </View>
            </View>

            <View
              onLayout={(event) => {
                sectionOffsets.current.location = event.nativeEvent.layout.y;
              }}
            >
              <SectionTitle>Location</SectionTitle>
              <SurfaceCard style={styles.card}>
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Ionicons
                      name={location?.source === "device" ? "location" : "map"}
                      size={21}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.locationCopy}>
                    <Text style={styles.locationName}>
                      {location?.name || "No location selected"}
                    </Text>
                    <Text style={styles.locationStatus}>
                      {location
                        ? `${locationSourceLabel(location)} · ${formatRelativeLocationAge(location.capturedAt)}`
                        : "Choose a location to calculate prayer times"}
                    </Text>
                    {location ? (
                      <Text style={styles.locationZone}>
                        {location.timeZone}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {location ? (
                  <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
                    <Text selectable style={styles.locationStatus}>Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</Text>
                    <Text style={styles.locationStatus}>{location.source === "device" ? `${formatLocationAccuracy(location.accuracy)} · ${location.fixKind === "cached" ? "Cached reading; not a new detection" : "Received from your phone"}` : "This city was selected manually. Use phone location to detect where you are."}</Text>
                  </View>
                ) : null}
                <AppButton
                  label={
                    locating
                      ? "Finding your location"
                      : "Use current phone location"
                  }
                  icon="location"
                  loading={locating}
                  onPress={onUseCurrentLocation}
                  style={styles.locationButton}
                />
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    void Linking.openURL("https://locationiq.com").catch(
                      () => undefined,
                    )
                  }
                  style={styles.locationAttribution}
                >
                  {/* <Text style={styles.locationAttributionText}>Search by LocationIQ.com</Text> */}
                </Pressable>
                {locating && locationProgress ? <Text accessibilityLiveRegion="polite" style={styles.alarmHelp}>{locationProgress}</Text> : null}
                {locationIssue ? (
                  <View
                    accessibilityLiveRegion="polite"
                    style={styles.issueBox}
                  >
                    <Text style={styles.issueText}>
                      {locationIssue.message}
                    </Text>
                    {locationIssue.canOpenSettings ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={onOpenPhoneSettings}
                      >
                        <Text style={styles.issueAction}>
                          Open phone settings
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </SurfaceCard>

              {recentLocations.length > 1 ? (
                <SurfaceCard style={styles.card}>
                  <Text style={styles.cardLabel}>Recent locations</Text>
                  {recentLocations.slice(0, 4).map((item, index) => (
                    <Pressable
                      key={`${item.lat}-${item.lng}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${item.name}`}
                      onPress={() => void onUseRecentLocation(item)}
                      style={({ pressed }) => [
                        styles.recentRow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={colors.inkSoft}
                      />
                      <View style={styles.recentCopy}>
                        <Text numberOfLines={1} style={styles.recentName}>
                          {item.name}
                        </Text>
                        <Text style={styles.recentZone}>{item.timeZone}</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={colors.inkSoft}
                      />
                    </Pressable>
                  ))}
                </SurfaceCard>
              ) : null}

              <SurfaceCard style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Search for a location"
                  accessibilityState={{ expanded: advancedOpen }}
                  onPress={() => setAdvancedOpen((current) => !current)}
                  style={({ pressed }) => [
                    styles.advancedHeader,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.settingMiniIcon}>
                    <Ionicons
                      name="search-outline"
                      size={19}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.advancedCopy}>
                    <Text style={styles.advancedTitle}>
                      Search for a location
                    </Text>
                    <Text style={styles.advancedSubtitle}>
                      Find a city or area by name
                    </Text>
                  </View>
                  <Ionicons
                    name={advancedOpen ? "chevron-up" : "chevron-down"}
                    size={19}
                    color={colors.inkSoft}
                  />
                </Pressable>
                {advancedOpen ? (
                  <View style={styles.manualForm}>
                    <Text style={styles.inputLabel}>City or area</Text>
                    <TextInput
                      accessibilityLabel="City or area"
                      autoCapitalize="words"
                      autoCorrect={false}
                      onChangeText={(value) => {
                        setLocationQuery(value);
                        setLocationResults([]);
                        setSearchIssue(null);
                        setSearchingLocation(false);
                      }}
                      placeholder="Jamalpur, Bangladesh"
                      placeholderTextColor={colors.inkSoft}
                      returnKeyType="search"
                      style={styles.input}
                      value={locationQuery}
                    />
                    {searchingLocation ? (
                      <View
                        accessibilityLiveRegion="polite"
                        style={styles.searchStatus}
                      >
                        <ActivityIndicator color={colors.accent} size="small" />
                        <Text style={styles.searchStatusText}>
                          Finding locations…
                        </Text>
                      </View>
                    ) : null}
                    {searchIssue ? (
                      <Text
                        accessibilityLiveRegion="polite"
                        style={styles.searchIssue}
                      >
                        {searchIssue}
                      </Text>
                    ) : null}
                    {locationResults.length > 0 ? (
                      <View style={styles.searchResults}>
                        {locationResults.map((result) => (
                          <Pressable
                            key={result.id}
                            accessibilityRole="button"
                            accessibilityLabel={`Use ${result.displayName}`}
                            disabled={applyingLocationId !== null}
                            onPress={() => void applyManualLocation(result)}
                            style={({ pressed }) => [
                              styles.searchResult,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Ionicons
                              name="location-outline"
                              size={18}
                              color={colors.accent}
                            />
                            <View style={styles.searchResultCopy}>
                              <Text
                                numberOfLines={1}
                                style={styles.searchResultName}
                              >
                                {result.name}
                              </Text>
                              <Text
                                numberOfLines={2}
                                style={styles.searchResultAddress}
                              >
                                {result.displayName}
                              </Text>
                            </View>
                            {applyingLocationId === result.id ? (
                              <Text style={styles.searchResultAction}>
                                Saving…
                              </Text>
                            ) : (
                              <Ionicons
                                name="chevron-forward"
                                size={17}
                                color={colors.inkSoft}
                              />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </SurfaceCard>
            </View>

            <View
              onLayout={(event) => {
                sectionOffsets.current.alarms = event.nativeEvent.layout.y;
              }}
            >
              <SectionTitle>Alarms & preferences</SectionTitle>
              <SurfaceCard style={styles.card}>
                <NotificationControls {...notificationControls} />
                <View style={styles.divider} />
                <SettingRow
                  icon="time-outline"
                  title="Alarm timing"
                  value={`${settings.alarmLeadMinutes} min before prayer ends`}
                  onPress={() => setAlarmTimingOpen(true)}
                />
                <Text style={styles.alarmHelp}>
                  Use the bell icons on the Prayer screen to turn individual
                  salat alarms on or off.
                </Text>
                <Text style={styles.alarmHelp}>
                  Reminders are prepared several days ahead. Open PrayerTime regularly to keep them up to date.
                </Text>
                {Platform.OS === "android" ? (
                  <>
                    <Text style={styles.alarmHelp}>For precise reminders, allow PrayerTime under your phone’s Alarms & reminders settings. Otherwise Android may delay them.</Text>
                    <AppButton label="Alarms & reminders access" variant="quiet" onPress={() => {
                      void Linking.sendIntent("android.settings.REQUEST_SCHEDULE_EXACT_ALARM")
                        .catch(() => Linking.openSettings()).catch(() => undefined);
                    }} />
                  </>
                ) : null}
                <View style={styles.divider} />
                <View style={styles.inlineSetting}>
                  <View style={styles.timeFormatIcon}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.timeFormatCopy}>
                    <Text style={styles.inlineTitle}>Time format</Text>
                    <Text style={styles.inlineSubtitle}>Clock display</Text>
                  </View>
                  <View style={styles.timeFormatControl}>
                    <SegmentedControl
                      label="Time format"
                      options={[
                        { id: "12h", name: "12h" },
                        { id: "24h", name: "24h" },
                      ]}
                      value={settings.timeFormat}
                      onChange={(value) =>
                        onUpdateSetting(
                          "timeFormat",
                          value as AppSettings["timeFormat"],
                        )
                      }
                    />
                  </View>
                </View>
                <View style={styles.divider} />
                <SettingRow
                  icon="moon-outline"
                  title="Ramadan card"
                  value={ramadanName}
                  onPress={() => setPicker("ramadan")}
                />
              </SurfaceCard>
            </View>

            <SectionTitle>Appearance</SectionTitle>
            <SurfaceCard style={styles.card}>
              <SettingRow
                icon="color-palette-outline"
                title="Theme"
                value={themeName}
                onPress={() => setPicker("theme")}
              />
            </SurfaceCard>

            <SectionTitle>Prayer calculation</SectionTitle>
            <SurfaceCard style={styles.card}>
              <SettingRow
                icon="calculator-outline"
                title="Calculation method"
                value={methodName}
                onPress={() => setPicker("method")}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="sunny-outline"
                title="Asr method"
                value={schoolName}
                onPress={() => setPicker("school")}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="contrast-outline"
                title="High-latitude rule"
                value={latitudeName}
                onPress={() => setPicker("latitude")}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="moon"
                title="Islamic midnight"
                value={midnightName}
                onPress={() => setPicker("midnight")}
              />
            </SurfaceCard>

            <View style={styles.privacyNote}>
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={colors.inkSoft}
              />
              <Text style={styles.privacyText}>
                LocationIQ resolves place names; your preferences stay on this
                device and prayer times are calculated locally.
              </Text>
            </View>
            <AppButton label="Location & privacy" icon="shield-checkmark-outline" variant="secondary" onPress={() => setPrivacyOpen(true)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PrivacySheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />

      <SelectionSheet
        visible={picker === "method"}
        title="Calculation method"
        options={CALCULATION_METHODS}
        value={settings.method}
        onSelect={(value) =>
          onUpdateSetting("method", value as AppSettings["method"])
        }
        onClose={() => setPicker(null)}
      />
      <SelectionSheet
        visible={picker === "school"}
        title="Asr method"
        options={ASR_METHODS}
        value={settings.school}
        onSelect={(value) =>
          onUpdateSetting("school", value as AppSettings["school"])
        }
        onClose={() => setPicker(null)}
      />
      <SelectionSheet
        visible={picker === "latitude"}
        title="High-latitude rule"
        options={HIGH_LATITUDE_RULES}
        value={settings.latitudeAdjustmentMethod}
        onSelect={(value) =>
          onUpdateSetting(
            "latitudeAdjustmentMethod",
            value as AppSettings["latitudeAdjustmentMethod"],
          )
        }
        onClose={() => setPicker(null)}
      />
      <SelectionSheet
        visible={picker === "midnight"}
        title="Islamic midnight"
        options={MIDNIGHT_MODES}
        value={settings.midnightMode}
        onSelect={(value) =>
          onUpdateSetting("midnightMode", value as AppSettings["midnightMode"])
        }
        onClose={() => setPicker(null)}
      />
      <SelectionSheet
        visible={picker === "ramadan"}
        title="Ramadan card"
        options={RAMADAN_OPTIONS}
        value={settings.ramadanMode}
        onSelect={(value) =>
          onUpdateSetting("ramadanMode", value as AppSettings["ramadanMode"])
        }
        onClose={() => setPicker(null)}
      />
      <SelectionSheet
        visible={picker === "theme"}
        title="Theme"
        options={THEME_OPTIONS}
        value={settings.themeMode}
        onSelect={(value) =>
          onUpdateSetting("themeMode", value as AppSettings["themeMode"])
        }
        onClose={() => setPicker(null)}
      />
      <AlarmTimingSheet
        value={settings.alarmLeadMinutes}
        visible={alarmTimingOpen}
        onSave={onSetAlarmLeadMinutes}
        onClose={() => setAlarmTimingOpen(false)}
      />
    </>
  );
}

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: spacing.lg },
    page: { alignSelf: "center", maxWidth: 620, width: "100%" },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    headerCopy: { flex: 1 },
    title: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_800ExtraBold",
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.7,
    },
    subtitle: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 13,
      marginTop: 3,
    },
    card: { marginBottom: spacing.md, overflow: "hidden" },
    locationRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      padding: spacing.lg,
    },
    locationIcon: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      height: 42,
      justifyContent: "center",
      marginRight: spacing.md,
      width: 42,
    },
    locationCopy: { flex: 1 },
    locationName: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 16,
      fontWeight: "700",
    },
    locationStatus: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 12,
      marginTop: 3,
    },
    locationZone: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 10,
      marginTop: 2,
    },
    locationButton: { marginBottom: spacing.lg, marginHorizontal: spacing.lg },
    locationAttribution: {
      alignSelf: "center",
      marginBottom: spacing.lg,
      marginTop: -spacing.sm,
    },
    locationAttributionText: {
      color: colors.accent,
      fontFamily: "BricolageGrotesque_600SemiBold",
      fontSize: 10,
      fontWeight: "600",
    },
    issueBox: {
      backgroundColor: colors.warningSurface,
      borderRadius: radii.md,
      marginBottom: spacing.lg,
      marginHorizontal: spacing.lg,
      padding: spacing.md,
    },
    issueText: {
      color: colors.warningText,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 12,
      lineHeight: 17,
    },
    issueAction: {
      color: colors.warningText,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 13,
      fontWeight: "700",
      marginTop: spacing.sm,
    },
    alarmHelp: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 11,
      lineHeight: 16,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    cardLabel: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 11,
      fontWeight: "700",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    recentRow: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: 54,
      paddingHorizontal: spacing.lg,
    },
    pressed: { opacity: 0.65 },
    recentCopy: { flex: 1, marginLeft: spacing.md },
    recentName: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_600SemiBold",
      fontSize: 14,
      fontWeight: "600",
    },
    recentZone: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 10,
      marginTop: 2,
    },
    advancedHeader: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: 64,
      paddingHorizontal: spacing.lg,
    },
    settingMiniIcon: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.sm,
      height: 36,
      justifyContent: "center",
      marginRight: spacing.md,
      width: 36,
    },
    advancedCopy: { flex: 1 },
    advancedTitle: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 14,
      fontWeight: "700",
    },
    advancedSubtitle: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 11,
      marginTop: 2,
    },
    manualForm: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      padding: spacing.lg,
    },
    inputLabel: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 11,
      fontWeight: "700",
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderRadius: radii.md,
      borderWidth: 1,
      color: colors.ink,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 14,
      minHeight: 48,
      paddingHorizontal: spacing.md,
    },
    searchStatus: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    searchStatusText: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_500Medium",
      fontSize: 12,
    },
    searchIssue: {
      color: colors.warningText,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 12,
      lineHeight: 17,
      marginTop: spacing.md,
    },
    searchResults: {
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    searchResult: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      minHeight: 64,
      padding: spacing.md,
    },
    searchResultCopy: { flex: 1, marginHorizontal: spacing.md },
    searchResultName: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 13,
      fontWeight: "700",
    },
    searchResultAddress: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 10,
      lineHeight: 14,
      marginTop: 2,
    },
    searchResultAction: {
      color: colors.accent,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 11,
      fontWeight: "700",
    },
    divider: {
      backgroundColor: colors.border,
      height: StyleSheet.hairlineWidth,
      marginLeft: 66,
    },
    inlineSetting: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: 68,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    timeFormatIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      marginRight: spacing.md,
      width: 40,
    },
    timeFormatCopy: { flex: 1, paddingRight: spacing.md },
    timeFormatControl: { width: 120 },
    inlineTitle: {
      color: colors.ink,
      fontFamily: "BricolageGrotesque_700Bold",
      fontSize: 14,
      fontWeight: "700",
    },
    inlineSubtitle: {
      color: colors.inkSoft,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 11,
      marginTop: 2,
    },
    privacyNote: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.lg,
    },
    privacyText: {
      color: colors.inkSoft,
      flex: 1,
      fontFamily: "BricolageGrotesque_400Regular",
      fontSize: 12,
      lineHeight: 18,
    },
  }),
);
