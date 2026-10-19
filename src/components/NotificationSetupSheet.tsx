import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "./BottomSheetModal";
import { AppButton } from "./ui";
import { SheetHeader } from "./SheetHeader";
import { createThemedStyles } from "../theme";
import { notificationAccessMessage } from "../services/notificationAccess";
import type { ReminderSetupStep } from "../services/reminderSetup";
import type { NotificationAccess } from "../types";

export function NotificationSetupSheet({ step, access, busy, issue, onRetry, onOpenSettings, onOpenTimingSettings, onDismiss }: {
  step: ReminderSetupStep;
  access: NotificationAccess;
  busy: boolean;
  issue: string | null;
  onRetry: () => Promise<boolean>;
  onOpenSettings: () => Promise<void>;
  onOpenTimingSettings: () => Promise<void>;
  onDismiss: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const timing = step === "timing";
  const needsSettings = access.status === "blocked" || access.channelBlocked;
  const title = timing ? "On-time reminders" : "Allow prayer reminders";
  return <BottomSheetModal visible={step !== null} onClose={onDismiss} closeLabel="Set up reminders later" sheetStyle={styles.sheet}>
    <SheetHeader title={title} onClose={onDismiss} />
    <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
      <View style={styles.icon}><Ionicons name={timing ? "time-outline" : "notifications-outline"} size={30} color={colors.accent} /></View>
      <Text style={styles.body}>{timing
        ? "Allow on-time reminders so your prayer notifications arrive when scheduled. Without this access, Android may delay them."
        : issue || notificationAccessMessage(access) || "Allow notifications on your phone to receive your selected prayer reminders."}</Text>
      {timing ? <Text style={styles.note}>Reminders are already on. You can continue with your current phone settings or allow precise timing now.</Text> : null}
      {timing && issue ? <Text accessibilityLiveRegion="polite" style={styles.error}>{issue}</Text> : null}
      <AppButton label={timing ? "Allow on-time reminders" : needsSettings ? "Open settings" : "Try again"}
        loading={busy} onPress={() => { void (timing ? onOpenTimingSettings() : needsSettings ? onOpenSettings() : onRetry()); }} />
      <AppButton label="Later" variant="quiet" onPress={onDismiss} style={{ marginTop: 10 }} />
    </ScrollView>
  </BottomSheetModal>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "90%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20 },
  icon: { height: 58, width: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSurface, marginBottom: 18 },
  body: { color: colors.ink, fontFamily: "BricolageGrotesque_400Regular", fontSize: 16, lineHeight: 24, marginBottom: 16 },
  note: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 24 },
  error: { color: colors.warningText, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 16 }
}));
