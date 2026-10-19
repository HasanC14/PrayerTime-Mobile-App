import { useCallback, useEffect, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "@expo-google-fonts/bricolage-grotesque/useFonts";
import { BricolageGrotesque_400Regular } from "@expo-google-fonts/bricolage-grotesque/400Regular";
import { BricolageGrotesque_500Medium } from "@expo-google-fonts/bricolage-grotesque/500Medium";
import { BricolageGrotesque_600SemiBold } from "@expo-google-fonts/bricolage-grotesque/600SemiBold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";

import { NotoSansBengali_400Regular } from "@expo-google-fonts/noto-sans-bengali/400Regular";
import { NotoSansBengali_500Medium } from "@expo-google-fonts/noto-sans-bengali/500Medium";
import { NotoSansBengali_600SemiBold } from "@expo-google-fonts/noto-sans-bengali/600SemiBold";
import { NotoSansBengali_700Bold } from "@expo-google-fonts/noto-sans-bengali/700Bold";
import { NotoSansBengali_800ExtraBold } from "@expo-google-fonts/noto-sans-bengali/800ExtraBold";
import { NotoSansArabic_400Regular } from "@expo-google-fonts/noto-sans-arabic/400Regular";
import { NotoSansArabic_500Medium } from "@expo-google-fonts/noto-sans-arabic/500Medium";
import { NotoSansArabic_600SemiBold } from "@expo-google-fonts/noto-sans-arabic/600SemiBold";
import { NotoSansArabic_700Bold } from "@expo-google-fonts/noto-sans-arabic/700Bold";
import { NotoSansArabic_800ExtraBold } from "@expo-google-fonts/noto-sans-arabic/800ExtraBold";

import { TextScaleProvider } from "./typography";
import type { AppLanguage } from "./types";
import { I18nProvider, useI18n } from "./i18n/context";
import { AppBackground } from "./components/ui";
import { AnimatedSplash, SPLASH_BACKGROUND } from "./components/AnimatedSplash";
import { usePrayerTimeApp } from "./hooks/usePrayerTimeApp";
import { AppTabs } from "./navigation/AppTabs";
import { LocationOnboarding } from "./screens/LocationOnboarding";
import { SettingsScreen } from "./screens/SettingsScreen";
import { NotificationSetupSheet } from "./components/NotificationSetupSheet";
import { AppThemeProvider, useAppTheme } from "./theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type AppController = ReturnType<typeof usePrayerTimeApp>;

function PrayerTimeContent({
  app,
  manualSetupOpen,
  setManualSetupOpen
}: {
  app: AppController;
  manualSetupOpen: boolean;
  setManualSetupOpen: (open: boolean) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const { isRTL } = useI18n();
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: "transparent",
      card: colors.surface,
      text: colors.ink,
      border: colors.border,
      primary: colors.accent
    }
  };

  if (!app.location && manualSetupOpen) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
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
          onBack={() => setManualSetupOpen(false)}
        />
      </AppBackground>
    );
  }

  if (!app.location) {
    return (
      <AppBackground>
        <StatusBar style={isDark ? "light" : "dark"} />
        <LocationOnboarding
          locating={app.locating}
          progress={app.locationProgress}
          issue={app.locationIssue}
          onUseLocation={() => void app.refreshDeviceLocation(true)}
          onChooseManually={() => setManualSetupOpen(true)}
          onUseDhaka={() => void app.useDhakaTemporarily()}
          onOpenSettings={() => void app.openLocationSettings()}
        />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer theme={navigationTheme} direction={isRTL ? "rtl" : "ltr"}>
        <AppTabs app={app} />
      </NavigationContainer>
    </AppBackground>
  );
}

function PrayerTimeApp({ fontsReady }: { fontsReady: boolean }) {
  const app = usePrayerTimeApp();
  const [manualSetupOpen, setManualSetupOpen] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const finishSplash = useCallback(() => setSplashVisible(false), []);
  const ready = !app.booting && fontsReady;
  const { updateSetting } = app;
  const changeLanguage = useCallback((language: AppLanguage) => updateSetting("language", language), [updateSetting]);

  useEffect(() => {
    if (!manualSetupOpen || app.location) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setManualSetupOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [app.location, manualSetupOpen]);

  return (
    <I18nProvider language={app.settings.language} onChangeLanguage={changeLanguage}>
    <TextScaleProvider value={app.settings.textScale}>
    <View style={styles.root}>
      {ready ? (
        <View
          style={styles.content}
          accessibilityElementsHidden={splashVisible}
          importantForAccessibility={splashVisible ? "no-hide-descendants" : "auto"}
          pointerEvents={splashVisible ? "none" : "auto"}
        >
          <AppThemeProvider mode={app.settings.themeMode}>
            <PrayerTimeContent
              app={app}
              manualSetupOpen={manualSetupOpen}
              setManualSetupOpen={setManualSetupOpen}
            />
            <NotificationSetupSheet step={app.notificationSetupStep} onDismiss={app.dismissNotificationSetup}
              access={app.notificationAccess} busy={app.notificationBusy} issue={app.notificationIssue}
              onRetry={app.retryReminderSetup} onOpenSettings={app.openNotificationSettings}
              onOpenTimingSettings={app.openReminderTimingSettings} />
          </AppThemeProvider>
        </View>
      ) : null}
      {splashVisible ? <AnimatedSplash fontsReady={fontsReady} ready={ready} onFinished={finishSplash} /> : null}
    </View>
    </TextScaleProvider>
    </I18nProvider>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
    NotoSansBengali_700Bold,
    NotoSansBengali_800ExtraBold,
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
    NotoSansArabic_800ExtraBold
  });

  useEffect(() => {
    if (fontError) console.warn("App fonts could not be loaded", fontError);
  }, [fontError]);

  return (
    <SafeAreaProvider>
      <PrayerTimeApp fontsReady={fontsLoaded || Boolean(fontError)} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPLASH_BACKGROUND },
  content: { flex: 1 }
});
