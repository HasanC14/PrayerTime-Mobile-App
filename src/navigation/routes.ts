import type { LinkingOptions, NavigatorScreenParams } from "@react-navigation/native";
import type { SettingsSection } from "../screens/SettingsScreen";

export type PrayerTabParamList = {
  Prayer: undefined;
  Qibla: undefined;
  Tasbeeh: undefined;
  Calendar: undefined;
  Journal: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<PrayerTabParamList> | undefined;
  Settings: {section?: SettingsSection; requestId?: number} | undefined;
};

export const APP_LINKING_CONFIG: NonNullable<LinkingOptions<RootStackParamList>["config"]> = {
  screens: {Main: {screens: {Prayer: "prayer"}}},
};
