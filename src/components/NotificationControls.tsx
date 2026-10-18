import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { isRunningInExpoGo } from "expo";
import { AppButton } from "./ui";
import { createThemedStyles, spacing } from "../theme";
import type { NotificationAccess } from "../types";
import { notificationAccessMessage } from "../services/notificationAccess";

export interface NotificationControlProps {
  enabled: boolean;
  access: NotificationAccess;
  busy: boolean;
  issue: string | null;
  testMessage: string | null;
  onEnable: (enabled: boolean) => Promise<boolean>;
  onTest: () => Promise<void>;
  onOpenSettings: () => void;
}

export function NotificationControls({ enabled, access, busy, issue, testMessage, onEnable, onTest, onOpenSettings }: NotificationControlProps) {
  const { colors, styles } = useStyles();
  const expoGo = Platform.OS !== "web" && isRunningInExpoGo();
  const supported = access.status !== "unsupported";
  const needsSettings = access.status === "blocked" || access.channelBlocked;
  const ready = access.status === "granted" && !access.channelBlocked;
  const message = issue || notificationAccessMessage(access);
  return (
    <View style={styles.content}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>Prayer reminders</Text>
          <Text style={styles.text}>{enabled ? ready ? "On for your selected prayers" : "Selected prayers need phone notification access" : "Off · enable to receive prayer reminders"}</Text>
        </View>
        <Switch accessibilityLabel="Prayer reminders" value={enabled} disabled={busy || !supported} onValueChange={(value) => void onEnable(value)} trackColor={{ true: colors.accent, false: colors.borderStrong }} />
      </View>
      <Text style={styles.text}>Phone permission: {access.status === "granted" ? "Allowed" : access.status === "blocked" ? "Blocked in settings" : access.status === "denied" ? "Not granted" : access.status === "unsupported" ? "Unavailable in web preview" : access.status === "unknown" ? "Checking…" : "Not requested"}.</Text>
      {expoGo ? <Text style={styles.text}>You’re previewing in Expo Go. Permissions and phone settings belong to Expo Go; Android will not ask again if access is already allowed.</Text> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text> : null}
      {supported && (!enabled || needsSettings || access.status !== "granted") ? <AppButton label={needsSettings ? "Open notification settings" : "Enable reminders"} loading={busy} onPress={() => needsSettings ? onOpenSettings() : void onEnable(true)} /> : null}
      <AppButton label="Send test reminder" icon="notifications-outline" variant="secondary" disabled={!supported} loading={busy} onPress={() => void onTest()} />
      {testMessage ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{testMessage}</Text> : null}
      {supported ? <AppButton label="Phone notification settings" variant="quiet" onPress={onOpenSettings} /> : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  copy: { flex: 1 },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 17 },
  text: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19 },
  notice: { color: colors.warningText, backgroundColor: colors.warningSurface, borderRadius: 12, padding: spacing.md, fontSize: 13, lineHeight: 19 }
}));
