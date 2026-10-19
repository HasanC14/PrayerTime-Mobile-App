import { useCallback, useState, type ComponentProps } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n/context";
import type { usePrayerTimeApp } from "../hooks/usePrayerTimeApp";
import { CalendarScreen } from "../screens/CalendarScreen";
import { GuidanceSheet } from "../screens/GuidanceSheet";
import { HomeScreen } from "../screens/HomeScreen";
import { QiblaScreen } from "../screens/QiblaScreen";
import { useTextScale } from "../typography";
import { TasbeehScreen } from "../screens/TasbeehScreen";
import { TasbeehIcon } from "../components/TasbeehIcon";
import { SettingsScreen } from "../screens/SettingsScreen";
import type { SettingsSection } from "../screens/SettingsScreen";
import { createThemedStyles } from "../theme";

type AppController = ReturnType<typeof usePrayerTimeApp>;
type RootTabParamList = {
  Prayer: undefined;
  Qibla: undefined;
  Tasbeeh: undefined;
  Calendar: undefined;
  Settings: { section?: SettingsSection; requestId?: number } | undefined;
};

const DONATION_URL =
  process.env.EXPO_PUBLIC_DONATION_URL?.trim() || "https://www.supportkori.com/devhasan";

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, { active: ComponentProps<typeof Ionicons>["name"]; inactive: ComponentProps<typeof Ionicons>["name"] }> = {
  Prayer: { active: "time", inactive: "time-outline" },
  Qibla: { active: "compass", inactive: "compass-outline" },
  Tasbeeh: { active: "ellipse", inactive: "ellipse-outline" },
  Calendar: { active: "calendar", inactive: "calendar-clear-outline" },
  Settings: { active: "settings", inactive: "settings-outline" }
};

export function AppTabs({ app }: { app: AppController }) {
  const { colors, styles } = useStyles();
  const { t } = useI18n();
  const textScale = useTextScale();
  const insets = useSafeAreaInsets();
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const { openLocationSettings: openPhoneSettings, refreshDeviceLocation } = app;
  const handlePhoneLocation = useCallback(
    (requestPermission: boolean) => void refreshDeviceLocation(requestPermission),
    [refreshDeviceLocation]
  );
  const handleOpenPhoneSettings = useCallback(
    () => void openPhoneSettings(),
    [openPhoneSettings]
  );

  return (
    <>
      <Tab.Navigator
        initialRouteName="Prayer"
        backBehavior="history"
        screenListeners={{
          tabPress: () => {
            void Haptics.selectionAsync().catch(() => undefined);
          }
        }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarAccessibilityLabel: t(route.name),
          lazy: true,
          sceneStyle: styles.scene,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.inkSoft,
          tabBarHideOnKeyboard: true,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [
            styles.tabBar,
            {
              height: 62 + (textScale > 1.15 ? 16 : 0) + Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 6),
              paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 6)
            }
          ],
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              {route.name === "Tasbeeh" ? <TasbeehIcon size={focused ? 24 : 23} color={color} /> : <Ionicons name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive} size={focused ? 22 : 21} color={color} />}
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}>{route.name}</Text>
          )
        })}
      >
        <Tab.Screen name="Prayer">
          {({ navigation }) => (
            <HomeScreen
              location={app.location!}
              settings={app.settings}
              now={app.now}
              today={app.today}
              calendar={app.calendar}
              prayerState={app.prayerState}
              guidance={app.guidance}
              calculationError={app.calculationError}
              locating={app.locating}
              locationIssue={app.locationIssue}
              notificationIssue={app.notificationIssue}
              locationProgress={app.locationProgress}
              onOpenLocation={() => navigation.navigate("Settings", { section: "location", requestId: Date.now() })}
              onDonate={() => void Linking.openURL(DONATION_URL).catch(() => undefined)}
              onTogglePrayerAlarm={app.togglePrayerAlarm}
              onRefresh={() => {
                if (app.location?.source === "device") void app.refreshDeviceLocation(false);
                else navigation.navigate("Settings", { section: "location", requestId: Date.now() });
              }}
              onOpenGuidance={() => setGuidanceOpen(true)}
              onRetry={app.retryCalculation}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Qibla">
          {() => (
            <QiblaScreen
              location={app.location!}
              locating={app.locating}
              locationIssue={app.locationIssue}
              onUsePhoneLocation={handlePhoneLocation}
              onOpenPhoneSettings={handleOpenPhoneSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Tasbeeh" component={TasbeehScreen} />
        <Tab.Screen name="Calendar">
          {() => <CalendarScreen location={app.location!} settings={app.settings} now={app.now} />}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {({ route }) => (
            <SettingsScreen
              settings={app.settings}
              location={app.location}
              recentLocations={app.recentLocations}
              locating={app.locating}
              locationIssue={app.locationIssue}
              locationProgress={app.locationProgress}
              notificationControls={{ enabled: app.settings.notificationsEnabled, access: app.notificationAccess, busy: app.notificationBusy, onEnable: app.setNotificationsEnabled }}
              onUseCurrentLocation={() => void app.refreshDeviceLocation(true)}
              onSearchLocations={app.searchLocations}
              onUseManualLocation={app.useManualLocation}
              onUseRecentLocation={app.useRecentLocation}
              onOpenPhoneSettings={() => void app.openLocationSettings()}
              onUpdateSetting={app.updateSetting}
              onSetAlarmLeadMinutes={app.setAlarmLeadMinutes}
              focusRequest={
                route.params?.section && route.params.requestId
                  ? {
                      section: route.params.section,
                      requestId: route.params.requestId
                    }
                  : undefined
              }
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <GuidanceSheet
        visible={guidanceOpen}
        onClose={() => setGuidanceOpen(false)}
        day={app.today}
        timeFormat={app.settings.timeFormat}
      />
    </>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  scene: { backgroundColor: colors.background },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    paddingTop: 5,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.025,
    shadowRadius: 12
  },
  tabItem: { minHeight: 50 },
  tabLabel: { fontFamily: "BricolageGrotesque_500Medium", fontSize: 10, fontWeight: "500", textAlign: "center", marginTop: -1 },
  tabLabelActive: { fontFamily: "BricolageGrotesque_800ExtraBold", fontWeight: "800" },
  iconPill: { alignItems: "center", height: 30, justifyContent: "center", width: 52, borderRadius: 16 },
  iconPillActive: { backgroundColor: colors.selectedSurface }
}));
