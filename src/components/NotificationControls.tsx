import { PillSwitch } from "./PillSwitch";
import { SettingRow } from "./ui";
import type { NotificationAccess } from "../types";

export interface NotificationControlProps {
  enabled: boolean;
  access: NotificationAccess;
  busy: boolean;
  onEnable: (enabled: boolean) => Promise<boolean>;
}

export function NotificationControls({ enabled, access, busy, onEnable }: NotificationControlProps) {
  const ready = access.status === "granted" && !access.channelBlocked;
  return <SettingRow icon="notifications-outline" title="Prayer reminders"
    subtitle={busy ? "Checking reminder access…" : enabled && !ready ? "Notification access needed" : undefined}
    trailing={<PillSwitch label="Prayer reminders" value={enabled} busy={busy}
      disabled={access.status === "unsupported"} onValueChange={value => void onEnable(value)} />}
  />;
}
