import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n/context";
import { AppButton, ScreenHeader, SurfaceCard } from "../components/ui";
import { useQiblaCompass } from "../hooks/useQiblaCompass";
import { getCompassDirection, getQiblaBearing, getCompassPresentation } from "../services/qibla";
import { createThemedStyles, radii, shadows, spacing } from "../theme";
import type { AppLocation, LocationIssue } from "../types";

const QIBLA_LOCATION_STALE_MS = 15 * 60_000;

export function QiblaScreen({
  location,
  locating,
  locationIssue,
  onUsePhoneLocation,
  onOpenPhoneSettings
}: {
  location: AppLocation;
  locating: boolean;
  locationIssue: LocationIssue | null;
  onUsePhoneLocation: (requestPermission: boolean) => void;
  onOpenPhoneSettings: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { width: viewportWidth } = useWindowDimensions();
  const focused = useIsFocused();
  const refreshAttemptedForCapture = useRef<number | null>(null);
  const qiblaBearing = getQiblaBearing(location);
  const liveCompassEnabled = focused && location.source === "device" && qiblaBearing !== null;
  const compass = useQiblaCompass(liveCompassEnabled, qiblaBearing);
  const { needleRotation, markers } = getCompassPresentation(qiblaBearing, compass.heading);
  const dialSize = Math.min(
    264,
    Math.max(0, viewportWidth - spacing.xl * 4 - 4),
  );
  const tickSize = Math.max(0, dialSize - 40);

  useEffect(() => {
    if (!focused) {
      refreshAttemptedForCapture.current = null;
      return;
    }
    if (
      !locating &&
      location.source === "device" &&
      Date.now() - location.capturedAt > QIBLA_LOCATION_STALE_MS &&
      refreshAttemptedForCapture.current !== location.capturedAt
    ) {
      refreshAttemptedForCapture.current = location.capturedAt;
      onUsePhoneLocation(false);
    }
  }, [focused, locating, location.capturedAt, location.source, onUsePhoneLocation]);

  const turnInstruction = (() => {
    if (qiblaBearing === null) return "You are at the Kaaba";
    if (compass.relativeAngle === null) return `${Math.round(qiblaBearing)}° clockwise from true north`;
    if (compass.aligned) return "You are facing the Qibla";
    const direction = compass.relativeAngle > 0 ? "clockwise" : "counter-clockwise";
    return `Turn ${Math.round(Math.abs(compass.relativeAngle))}° ${direction}`;
  })();

  return (
    <View style={styles.screen}>
    <ScreenHeader title="Qibla" subtitle={`Direction from ${location.name}`} />
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: spacing.xs, paddingBottom: Math.max(insets.bottom, spacing.xxl) }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        <SurfaceCard style={styles.compassCard}>
          <Text style={styles.bearingLabel}>Qibla bearing</Text>
          <Text style={styles.bearingValue}>
            {qiblaBearing === null ? "—" : `${Math.round(qiblaBearing)}° ${getCompassDirection(qiblaBearing)}`}
          </Text>

          <View
            accessibilityLabel={t(turnInstruction)}
            style={[
              styles.dial,
              {
                borderRadius: dialSize / 2,
                height: dialSize,
                width: dialSize,
              },
            ]}
          >
            {markers.map(marker => <View key={marker.direction} testID={`compass-${marker.direction}`}
              style={[styles.cardinalPosition, { left: dialSize / 2 + marker.x * (dialSize / 2 - 24) - 34,
                top: dialSize / 2 + marker.y * (dialSize / 2 - 24) - 15 }]}>
              <Text style={[styles.cardinal, marker.direction === "N" && { color: colors.accent }]}>{marker.direction}</Text>
            </View>)}
            <View
              style={[
                styles.tickRing,
                {
                  borderRadius: tickSize / 2,
                  height: tickSize,
                  width: tickSize,
                },
              ]}
            />
            <View style={[styles.needleWrap, { height: dialSize * 0.62, transform: [{ rotate: `${needleRotation}deg` }] }]}> 
              <View style={styles.needle}>
                <Ionicons name="arrow-up" size={38} color={colors.onAccent} />
              </View>
              <View style={styles.needleTail} />
            </View>
            <View style={styles.dialCenter}>
              <View style={styles.dialCenterDot} />
            </View>
          </View>

          <Text style={styles.phoneHeading}>{compass.heading === null ? "North-up view" : t("Phone facing {direction} · {degrees}°", { direction: getCompassDirection(compass.heading), degrees: Math.round(compass.heading) })}</Text>
          <View style={[styles.directionPill, compass.aligned && styles.directionPillAligned]}>
            <Ionicons
              name={compass.aligned ? "checkmark-circle" : "phone-portrait-outline"}
              size={18}
              color={compass.aligned ? colors.success : colors.accent}
            />
            <Text style={[styles.directionText, compass.aligned && styles.directionTextAligned]}>
              {turnInstruction}
            </Text>
          </View>
        </SurfaceCard>

        {location.source !== "device" ? (
          <SurfaceCard style={styles.manualNotice}>
            <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Based on your chosen city</Text>
              <Text style={styles.noticeText}>
                Live compass guidance is available when you use the phone’s current location.
              </Text>
            </View>
            <AppButton
              label="Use phone location"
              loading={locating}
              variant="quiet"
              onPress={() => onUsePhoneLocation(true)}
              style={styles.noticeButton}
            />
          </SurfaceCard>
        ) : (
          <View style={styles.tips}>
            <View style={styles.tipRow}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.tipText}>Hold your phone flat and level.</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="magnet-outline" size={20} color={colors.inkSoft} />
              <Text style={styles.tipText}>Move away from magnets and metal objects.</Text>
            </View>
            {compass.headingReference ? (
              <View style={styles.tipRow}>
                <Ionicons name="locate-outline" size={20} color={colors.inkSoft} />
                <Text style={styles.tipText}>
                  {compass.headingReference === "true"
                    ? "Direction is referenced to true north."
                    : "Using magnetic north fallback; direction may vary slightly."}
                </Text>
              </View>
            ) : null}
            {compass.accuracy !== null && compass.accuracy < 2 ? (
              <View style={styles.calibrationNotice}>
                <Ionicons name="sync-outline" size={20} color={colors.warningText} />
                <Text style={styles.calibrationText}>Move your phone in a figure eight to calibrate the compass.</Text>
              </View>
            ) : null}
            {compass.error ? <Text style={styles.errorText}>{compass.error}</Text> : null}
          </View>
        )}

        {locationIssue ? (
          <View accessibilityLiveRegion="polite" style={styles.locationIssue}>
            <Ionicons name="location-outline" size={20} color={colors.warningText} />
            <View style={styles.locationIssueCopy}>
              <Text style={styles.locationIssueText}>{locationIssue.message}</Text>
              {locationIssue.canOpenSettings ? (
                <AppButton
                  label="Open phone settings"
                  variant="quiet"
                  onPress={onOpenPhoneSettings}
                  style={styles.locationIssueButton}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  page: { alignSelf: "center", maxWidth: 620, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xxl },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, marginTop: 3 },
  headerIcon: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radii.md, height: 46, justifyContent: "center", width: 46, ...shadows.card },
  compassCard: { alignItems: "center", padding: spacing.xl },
  bearingLabel: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, fontWeight: "600" },
  bearingValue: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 24, fontVariant: ["tabular-nums"], fontWeight: "800", marginTop: spacing.xs },
  dial: { direction: "ltr",
    alignItems: "center",
    backgroundColor: colors.compassSurface,
    borderColor: colors.compassBorder,
    borderWidth: 2,
    justifyContent: "center",
    marginVertical: spacing.xxl,
    position: "relative",
  },
  tickRing: { borderColor: colors.compassTicks, borderStyle: "dashed", borderWidth: 1.5, position: "absolute" },
  cardinal: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 13, fontWeight: "700", textAlign: "center" },
  cardinalPosition: { position: "absolute", width: 68, minHeight: 30, alignItems: "center", justifyContent: "center" },
  phoneHeading: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, marginBottom: 12, textAlign: "center" },
  north: { top: 12 },
  east: { right: 15, top: "50%", transform: [{ translateY: -8 }] },
  south: { bottom: 12 },
  west: { left: 14, top: "50%", transform: [{ translateY: -8 }] },
  needleWrap: { alignItems: "center", justifyContent: "flex-start", position: "absolute", width: 72 },
  needle: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 34, height: 68, justifyContent: "center", width: 68, ...shadows.card },
  needleTail: { backgroundColor: colors.compassTail, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, height: 66, width: 12 },
  dialCenter: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, height: 36, justifyContent: "center", position: "absolute", width: 36, ...shadows.card },
  dialCenterDot: { backgroundColor: colors.ink, borderRadius: 6, height: 12, width: 12 },
  directionPill: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: "row", gap: spacing.sm, minHeight: 42, paddingHorizontal: spacing.lg },
  directionPillAligned: { backgroundColor: colors.successSurface },
  directionText: { flexShrink: 1, textAlign: "center", color: colors.accent, fontFamily: "BricolageGrotesque_700Bold", fontSize: 14, fontWeight: "700" },
  directionTextAligned: { color: colors.success },
  manualNotice: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg, padding: spacing.lg },
  noticeCopy: { flex: 1, minWidth: 220 },
  noticeTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, fontWeight: "700" },
  noticeText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 18, marginTop: 3 },
  noticeButton: { minHeight: 46, width: "100%" },
  tips: { gap: spacing.md, marginTop: spacing.xl, paddingHorizontal: spacing.sm },
  tipRow: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  tipText: { color: colors.inkSoft, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13 },
  calibrationNotice: { alignItems: "center", backgroundColor: colors.warningSurface, borderRadius: radii.md, flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  calibrationText: { color: colors.warningText, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 17 },
  errorText: { color: colors.danger, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, textAlign: "center" },
  locationIssue: { alignItems: "flex-start", backgroundColor: colors.warningSurface, borderRadius: radii.md, flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md },
  locationIssueCopy: { flex: 1 },
  locationIssueText: { color: colors.warningText, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 17 },
  locationIssueButton: { alignSelf: "flex-start", marginTop: spacing.sm, minHeight: 42 }
}));
