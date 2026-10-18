import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LocationIssue } from "../types";
import { createThemedStyles, radii, shadows, spacing } from "../theme";
import { AppButton } from "../components/ui";

export function LocationOnboarding({
  locating,
  progress,
  issue,
  onUseLocation,
  onChooseManually,
  onUseDhaka,
  onOpenSettings
}: {
  locating: boolean;
  progress: string | null;
  issue: LocationIssue | null;
  onUseLocation: () => void;
  onChooseManually: () => void;
  onUseDhaka: () => void;
  onOpenSettings: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        { paddingTop: Math.max(insets.top, spacing.xxl), paddingBottom: Math.max(insets.bottom, spacing.xxl) }
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Image source={require("../../assets/logo512.png")} resizeMode="contain" style={styles.logo} />
          </View>
          <Text style={styles.brand}>PrayerTime</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text accessibilityRole="header" style={styles.title}>
            Prayer times,{"\n"}right where you are.
          </Text>
          <Text style={styles.subtitle}>
            Use your phone’s location for accurate daily times, local timezone handling, and prayer alarms.
          </Text>
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>Private by design</Text>
            <Text style={styles.privacyText}>
              With your permission, your location updates while the app is open. Coordinates are sent to LocationIQ to find the city name. Prayer times are calculated on your phone, including offline.
            </Text>
          </View>
        </View>

        {issue ? (
          <View accessibilityLiveRegion="polite" style={styles.issueCard}>
            <Ionicons name="location-outline" size={22} color={colors.warningText} />
            <View style={styles.issueCopy}>
              <Text style={styles.issueTitle}>Location needs attention</Text>
              <Text style={styles.issueText}>{issue.message}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {locating && progress ? <Text accessibilityLiveRegion="polite" style={styles.privacyText}>{progress}</Text> : null}
          <AppButton
            label={locating ? "Finding your location" : "Use my current location"}
            icon="location"
            loading={locating}
            onPress={onUseLocation}
          />
          {issue?.canOpenSettings ? (
            <AppButton label="Open phone settings" icon="settings-outline" variant="secondary" onPress={onOpenSettings} />
          ) : null}
          <AppButton label="Choose location manually" icon="map-outline" variant="secondary" onPress={onChooseManually} />
          <AppButton label="Choose Dhaka manually" variant="quiet" onPress={onUseDhaka} />
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl
  },
  content: { alignSelf: "center", maxWidth: 520, width: "100%" },
  brandRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, marginBottom: spacing.xxxl },
  logoBadge: {
    alignItems: "center",
    backgroundColor: colors.heroStart,
    borderRadius: radii.lg,
    height: 58,
    justifyContent: "center",
    ...shadows.hero,
    width: 58
  },
  logo: { height: 42, width: 42 },
  brand: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  heroCopy: { marginBottom: spacing.xxl },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 42, fontWeight: "900", letterSpacing: -1.4, lineHeight: 47 },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 17, lineHeight: 25, marginTop: spacing.lg },
  privacyCard: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.lg,
    padding: spacing.lg
  },
  privacyIcon: {
    alignItems: "center",
    backgroundColor: colors.accentSurface,
    borderRadius: radii.md,
    height: 42,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 42
  },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, fontWeight: "700", marginBottom: spacing.xs },
  privacyText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19 },
  issueCard: {
    alignItems: "flex-start",
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg
  },
  issueCopy: { flex: 1 },
  issueTitle: { color: colors.warningText, fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, fontWeight: "700", marginBottom: spacing.xs },
  issueText: { color: colors.warningText, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19 },
  actions: { gap: spacing.md }
}));
