import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LocationIssue } from "../types";
import { createThemedStyles, spacing } from "../theme";
import { AppButton } from "../components/ui";
import { LanguageSelector } from "../components/LanguageSelector";
import { BrandMark } from "../components/BrandMark";

export function LocationOnboarding({
  locating, progress, issue, onUseLocation, onChooseManually, onOpenSettings
}: {
  locating: boolean;
  progress: string | null;
  issue: LocationIssue | null;
  onUseLocation: () => void;
  onChooseManually: () => void;
  onOpenSettings: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const compact = useWindowDimensions().height < 680;
  return (
    <ScrollView
      contentContainerStyle={[
        styles.screen,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <LanguageSelector />
        <View style={[styles.welcome, compact && styles.welcomeCompact]}>
          <View style={[styles.logoBadge, compact && styles.logoCompact]}><BrandMark height={compact ? 60 : 76} /></View>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>Welcome to PrayerTime</Text>
          <Text style={styles.subtitle}>Choose your location for local prayer times.</Text>
        </View>
        <View style={styles.actions}>
          {issue ? (
            <View accessibilityLiveRegion="polite" style={styles.notice}>
              <Text style={styles.noticeText}>{issue.message}</Text>
              {issue.canOpenSettings ? (
                <AppButton label="Open phone settings" icon="settings-outline" variant="quiet" onPress={onOpenSettings} />
              ) : null}
            </View>
          ) : null}
          {locating && progress ? <Text accessibilityLiveRegion="polite" style={styles.progress}>{progress}</Text> : null}
          <AppButton
            label={locating ? "Finding your location" : "Use my current location"}
            icon="locate-outline" loading={locating} onPress={onUseLocation}
          />
          <AppButton label="Choose a city" variant="quiet" onPress={onChooseManually} />
          <View style={styles.offlineNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.inkSoft} />
            <Text style={styles.footnote}>Prayer times work offline once your location is set.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  screen: { flexGrow: 1, paddingHorizontal: spacing.xl },
  content: { flexGrow: 1, alignSelf: "center", maxWidth: 440, width: "100%" },
  welcome: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xxxl },
  logoBadge: { alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSurface, width: 112, height: 112, borderRadius: 32, marginBottom: spacing.xxl },
  welcomeCompact: { paddingVertical: spacing.lg },
  logoCompact: { width: 88, height: 88, borderRadius: 26, marginBottom: spacing.lg },
  titleCompact: { fontSize: 28, lineHeight: 34 },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 32, fontWeight: "800", letterSpacing: -0.8, lineHeight: 39, textAlign: "center", width: "100%" },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: spacing.md, maxWidth: 300 },
  actions: { gap: spacing.sm },
  progress: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19, textAlign: "center", paddingBottom: spacing.sm },
  notice: { backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  noticeText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 14, lineHeight: 21 },
  offlineNote: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.sm },
  footnote: { flexShrink: 1, maxWidth: 280, color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 18 }
}));
