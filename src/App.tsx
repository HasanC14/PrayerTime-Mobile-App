import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "@expo-google-fonts/bricolage-grotesque/useFonts";

import { TextScaleProvider } from "./typography";
import type { AppLanguage, AppSettings } from "./types";
import { ENGLISH_FONTS } from "./constants/fonts";
import { loadLanguageFonts } from "./services/appFonts";
import { useLanguageFonts } from "./hooks/useLanguageFonts";
import { I18nProvider, useI18n } from "./i18n/context";
import { AppBackground, AppButton, ScreenHeader, SurfaceCard } from "./components/ui";
import { Text } from "./i18n/native";
import {AppErrorBoundary} from "./components/AppErrorBoundary";
import {recordDiagnostic} from "./services/diagnostics";
import { StorageIssueNotice } from "./components/StorageIssueNotice";
import { AnimatedSplash, SPLASH_BACKGROUND } from "./components/AnimatedSplash";
import { usePrayerTimeApp } from "./hooks/usePrayerTimeApp";
import { AppTabs } from "./navigation/AppTabs";
import { APP_LINKING_CONFIG, type RootStackParamList } from "./navigation/routes";
import { LocationOnboarding } from "./screens/LocationOnboarding";
import { LocationSheet } from "./components/LocationSheet";
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
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [recovering, setRecovering] = useState(false);
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

  if (app.restoreIssue) {
    return <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader title="PrayerTime" />
      <SurfaceCard style={{ margin: 20, padding: 20, gap: 16 }}>
        <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 22, fontFamily: "BricolageGrotesque_700Bold" }}>{"Couldn't load your saved data"}</Text>
        <Text style={{ color: colors.inkSoft, fontSize: 15, lineHeight: 22 }}>Please try again to restore your settings and location.</Text>
        <AppButton label="Try again" loading={app.booting} onPress={app.retryRestore} />
        <Text style={{color: colors.inkSoft, fontSize: 13}}>Recovery preserves unreadable settings in a local archive before starting with defaults. Your journal is kept.</Text>
        <AppButton label="Recover saved settings" variant="secondary" loading={recovering} onPress={() => {
          setRecovering(true); setRecoveryFailed(false);
          void app.recoverSavedData().catch(() => setRecoveryFailed(true)).finally(() => setRecovering(false));
        }} />
        {recoveryFailed ? <Text accessibilityLiveRegion="polite" style={{color: colors.inkSoft}}>The operation could not be completed. Your existing records have been kept.</Text> : null}
      </SurfaceCard>
    </AppBackground>;
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
          onOpenSettings={() => void app.openLocationSettings()}
        />
        <LocationSheet
          visible={manualSetupOpen}
          onClose={() => setManualSetupOpen(false)}
          location={app.location}
          locating={app.locating}
          locationIssue={app.locationIssue}
          locationProgress={app.locationProgress}
          onUseCurrentLocation={() => void app.refreshDeviceLocation(true)}
          onSearchLocations={app.searchLocations}
          onUseManualLocation={app.useManualLocation}
          onOpenPhoneSettings={() => void app.openLocationSettings()}
        />
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer<RootStackParamList> theme={navigationTheme} direction={isRTL ? "rtl" : "ltr"}
        linking={Platform.OS === "web" ? undefined : { prefixes: ["prayertime://"], config: APP_LINKING_CONFIG }}>
        <AppTabs app={app} />
      </NavigationContainer>
    </AppBackground>
  );
}

function PrayerTimeApp({ fontsReady }: { fontsReady: boolean }) {
  const app = usePrayerTimeApp();
  const [manualSetupOpen, setManualSetupOpen] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [startedAt] = useState(Date.now);
  const finishSplash = useCallback(() => {recordDiagnostic("startup", "success", Date.now() - startedAt); setSplashVisible(false);}, [startedAt]);
  const languageFontsReady = useLanguageFonts(app.settings.language, !app.booting || Boolean(app.restoreIssue));
  const ready = (!app.booting || app.restoreIssue) && fontsReady && languageFontsReady;
  const { updateSetting } = app;
  const languageRequest = useRef(0);
  const updateSettingWithFonts = useCallback(<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    if (key !== "language") {updateSetting(key, value); return;}
    const request = ++languageRequest.current;
    // Keep the current screen mounted until the next language is ready.
    void loadLanguageFonts(value as AppLanguage).catch(() => undefined).then(() => {
      if (request === languageRequest.current) updateSetting(key, value);
    });
  }, [updateSetting]);
  const changeLanguage = useCallback((language: AppLanguage) => updateSettingWithFonts("language", language), [updateSettingWithFonts]);

  useEffect(() => {
    if (splashVisible) return;
    // Give the first interactive frame priority over unused language fonts.
    const timer = setTimeout(() => {
      void Promise.all([loadLanguageFonts("bn"), loadLanguageFonts("ar")]).catch(() => undefined);
    }, 200);
    return () => clearTimeout(timer);
  }, [splashVisible]);

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
              app={{...app, updateSetting: updateSettingWithFonts}}
              manualSetupOpen={manualSetupOpen}
              setManualSetupOpen={setManualSetupOpen}
            />
            {app.storageIssue && !app.restoreIssue ? <StorageIssueNotice onRetry={app.retrySaving} /> : null}
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
  const [fontsLoaded, fontError] = useFonts(ENGLISH_FONTS);

  useEffect(() => {
    if (fontError) console.warn("App fonts could not be loaded", fontError);
  }, [fontError]);

  return (
    <SafeAreaProvider>
      <AppErrorBoundary><PrayerTimeApp fontsReady={fontsLoaded || Boolean(fontError)} /></AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SPLASH_BACKGROUND },
  content: { flex: 1 }
});
