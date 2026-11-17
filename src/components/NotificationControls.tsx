import {Text} from "../i18n/native";
import {useI18n} from "../i18n/context";
import {useAppTheme} from "../theme";
import type {NotificationCoverage} from "../services/notificationCoverage";
import { PillSwitch } from "./PillSwitch";
import { RowDivider, SettingRow } from "./ui";
import type { NotificationAccess } from "../types";

export interface NotificationControlProps {
  enabled: boolean;
  access: NotificationAccess;
  busy: boolean;
  onEnable: (enabled: boolean) => Promise<boolean>;
  startEnabled: boolean;
  onStartEnable: (enabled: boolean) => Promise<boolean>;
  coverage?: NotificationCoverage | null;
  timeZone?: string;
  timingAllowed: boolean | null;
  onOpenTimingSettings: () => Promise<void>;
}

export function NotificationControls({ enabled, access, busy, onEnable, startEnabled, onStartEnable, timingAllowed, onOpenTimingSettings, coverage, timeZone }: NotificationControlProps) {
  const {locale, t} = useI18n();
  const {colors} = useAppTheme();
  const ready = access.status === "granted" && !access.channelBlocked;
  return <>
    <SettingRow icon="notifications-outline" title="Prayer start notifications"
      subtitle={busy ? "Checking reminder access…" : startEnabled && !ready ? "Notification access needed" : "When each of the five prayers begins"}
      trailing={<PillSwitch testID="prayer-start-notifications" label="Prayer start notifications" value={startEnabled} busy={busy}
        disabled={access.status === "unsupported"} onValueChange={value => void onStartEnable(value)} />} />
    <RowDivider />
    <SettingRow icon="notifications-outline" title="Prayer reminders"
      subtitle={busy ? "Checking reminder access…" : enabled && !ready ? "Notification access needed" : "Before the prayer period ends"}
      trailing={<PillSwitch testID="prayer-end-reminders" label="Prayer reminders" value={enabled} busy={busy}
        disabled={access.status === "unsupported"} onValueChange={value => void onEnable(value)} />} />
    {(enabled || startEnabled) && ready && coverage && coverage.count > 0 ? <Text style={{paddingHorizontal: 16, paddingVertical: 10, color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 19}}>
      {t("Scheduled through {date}. Open PrayerTime occasionally to keep reminders up to date.", {date: new Intl.DateTimeFormat(locale, {month: "short", day: "numeric", timeZone}).format(new Date(coverage.until))})}
    </Text> : null}
    {timingAllowed === false ? <>
      <RowDivider />
      <SettingRow icon="time-outline" title="On-time updates" subtitle="Allow precise timing for notifications and widgets" onPress={() => void onOpenTimingSettings()} />
    </> : null}
  </>;
}
