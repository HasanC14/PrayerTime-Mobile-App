import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { AppButton, RowDivider, SettingRow, SettingsGroup } from "./ui";
import { createThemedStyles } from "../theme";
import type { AppLocation, LocationIssue, LocationSearchResult } from "../types";
import { formatLocationAccuracy } from "../utils/locationStatus";
import { hasLocationName } from "../services/locationPolicy";

export interface LocationSheetProps {
  location: AppLocation | null;
  locating: boolean;
  locationIssue: LocationIssue | null;
  locationProgress: string | null;
  onUseCurrentLocation: () => void;
  onSearchLocations: (query: string) => Promise<LocationSearchResult[]>;
  onUseManualLocation: (location: LocationSearchResult) => Promise<void>;
  onOpenPhoneSettings: () => void;
}

export function LocationSheet({ visible, onClose, location, locating, locationIssue, locationProgress, onUseCurrentLocation, onSearchLocations, onUseManualLocation, onOpenPhoneSettings }: LocationSheetProps & { visible: boolean; onClose: () => void }) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [issue, setIssue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState(false);
  const searchRevision = useRef(0);
  const savingRef = useRef(false);
  const resultsScrollRef = useRef<ScrollView>(null);
  const queryText = query.trim();
  const unnamedLocation = location && !hasLocationName(location);

  useEffect(() => {
    if (!visible || queryText.length < 2) return;
    let active = true;
    const revision = ++searchRevision.current;
    const current = () => active && revision === searchRevision.current;
    const timer = setTimeout(() => {
      setSearching(true);
      void Promise.resolve().then(() => onSearchLocations(queryText)).then((places) => {
        if (current()) { setResults(places); setSearched(true); }
      }).catch((error) => {
        if (current()) setIssue(error instanceof Error ? error.message : "Couldn't search. Please try again.");
      }).finally(() => { if (current()) setSearching(false); });
    }, 400);
    return () => { active = false; clearTimeout(timer); };
  }, [onSearchLocations, queryText, visible]);

  const select = async (apply: () => Promise<void>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    searchRevision.current++;
    setSearching(false);
    setSaving(true);
    setIssue(null);
    try { await apply(); setQuery(""); setResults([]); setSearched(false); onClose(); }
    catch { setIssue("Couldn't save this location. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return <BottomSheetModal visible={visible} onClose={onClose} closeLabel="Close location" sheetStyle={styles.sheet}>
    <SheetHeader title="Your location" onClose={onClose} />
      <View testID="city-search" style={styles.search}>
        <Ionicons name="search" size={20} color={colors.inkSoft} />
        <TextInput accessibilityLabel="City or area" placeholder="Search city or area" placeholderTextColor={colors.inkSoft} value={query} autoCapitalize="words" autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" style={styles.input} onSubmitEditing={() => Keyboard.dismiss()} onChangeText={text => {
          resultsScrollRef.current?.scrollTo({ y: 0, animated: false });
          searchRevision.current++;
          setQuery(text); setResults([]); setSearched(false); setIssue(null); setSearching(false);
        }} />
        {searching || saving ? <ActivityIndicator color={colors.accent} size="small" /> : null}
      </View>
    <ScrollView ref={resultsScrollRef} testID="location-results" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ flexShrink: 1, minHeight: 0 }} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      {!queryText ? <><View style={styles.current}>
        <View style={styles.locationIcon}><Ionicons name="location" size={23} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationName}>{location?.name || "Choose your city"}</Text>
          <Text style={styles.caption}>{unnamedLocation ? "Using coordinates. Prayer times work offline." : location ? location.source === "device" ? "Using your phone’s location" : "City selected manually" : "Use your phone or search below"}</Text>
          {unnamedLocation ? <Text selectable style={styles.caption}>{`${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}</Text> : null}
        </View>
      </View>
      <AppButton label={locating ? "Finding your location" : "Use current phone location"} icon="locate-outline" loading={locating} disabled={saving} onPress={onUseCurrentLocation} />
      {locating && locationProgress ? <Text accessibilityLiveRegion="polite" style={styles.help}>{locationProgress}</Text> : null}
      {locationIssue ? <View style={styles.notice}>
        <Text accessibilityLiveRegion="polite" style={styles.noticeText}>{locationIssue.message}</Text>
        {locationIssue.canOpenSettings ? <AppButton label="Open phone settings" variant="secondary" onPress={onOpenPhoneSettings} /> : null}
      </View> : null}
      </> : null}
      {issue ? <Text accessibilityLiveRegion="polite" style={styles.error}>{issue}</Text> : null}
      {queryText.length >= 2 && searched && !searching && !results.length ? <Text accessibilityLiveRegion="polite" style={styles.help}>No places found. Try a nearby city or include the country.</Text> : null}
      {results.length ? <SettingsGroup>{results.map((result, index) => <View key={result.id}>
        {index ? <RowDivider /> : null}
        <SettingRow icon="location-outline" title={result.name} subtitle={result.displayName} disabled={saving} onPress={() => void select(() => onUseManualLocation(result))} />
      </View>)}</SettingsGroup> : null}
      <Text accessibilityRole="link" onPress={() => void Linking.openURL("https://locationiq.com").catch(() => undefined)} style={styles.attribution}>Place search by LocationIQ</Text>
      {location && !queryText ? <>
        <SettingRow icon="information-circle-outline" title="Location details" onPress={() => setDetails(!details)} trailing={<Ionicons name={details ? "chevron-up" : "chevron-down"} size={16} color={colors.inkSoft} />} />
        {details ? <View style={styles.details}>
          <Text selectable style={styles.caption}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</Text>
          <Text style={styles.caption}>{location.timeZone}</Text>
          <Text style={styles.caption}>{location.source === "device" ? `${formatLocationAccuracy(location.accuracy)} · ${location.fixKind === "cached" ? "Cached reading" : "Received from your phone"}` : "Manually selected city"}</Text>
        </View> : null}
      </> : null}
    </ScrollView>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "91%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20 },
  current: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 20 },
  locationIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.accentSurface },
  locationName: { fontFamily: "BricolageGrotesque_700Bold", color: colors.ink, fontSize: 17 },
  caption: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 4 },
  help: { fontFamily: "BricolageGrotesque_400Regular", color: colors.inkSoft, fontSize: 13, lineHeight: 19, paddingVertical: 12 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 52, fontFamily: "BricolageGrotesque_400Regular", color: colors.ink, fontSize: 15 },
  error: { color: colors.danger, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, paddingVertical: 12 },
  notice: { backgroundColor: colors.warningSurface, borderRadius: 14, padding: 14, marginTop: 12, gap: 12 },
  noticeText: { fontFamily: "BricolageGrotesque_400Regular", color: colors.warningText, fontSize: 13, lineHeight: 19 },
  attribution: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, textAlign: "center", paddingVertical: 18 },
  details: { paddingHorizontal: 16, paddingBottom: 16 }
}));
