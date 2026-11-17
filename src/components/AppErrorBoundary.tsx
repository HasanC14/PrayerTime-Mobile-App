import {Component, useEffect, useState, type ReactNode} from "react";
import {Platform, Pressable, StyleSheet, Text, View} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import type {AppLanguage} from "../types";
import {translateMessage} from "../i18n/translate";
import {loadPersistedState} from "../services/storage";
import {recordDiagnostic} from "../services/diagnostics";

function RecoveryScreen({onRetry}: {onRetry: () => void}) {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const t = (message: string) => translateMessage(message, language);
  useEffect(() => {
    let active = true;
    void SplashScreen.hideAsync().catch(() => undefined);
    void loadPersistedState().then(({settings}) => {if (active) setLanguage(settings.language);}).catch(() => undefined);
    return () => {active = false;};
  }, []);
  return <View style={[styles.screen, {direction: language === "ar" ? "rtl" : "ltr"}]}>
    <Text accessibilityRole="header" style={styles.title}>{t("Let's reopen PrayerTime")}</Text>
    <Text style={styles.body}>{t("Something interrupted the screen. Your saved records have been kept.")}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={t("Try again")} onPress={onRetry} style={styles.button}><Text style={styles.buttonText}>{t("Try again")}</Text></Pressable>
  </View>;
}
export class AppErrorBoundary extends Component<{children: ReactNode}, {failed: boolean; revision: number}> {
  state = {failed: false, revision: 0};
  static getDerivedStateFromError() {return {failed: true};}
  componentDidCatch() {recordDiagnostic("render", "failed");}
  render() {
    if (this.state.failed) return <RecoveryScreen onRetry={() => this.setState(state => ({failed: false, revision: state.revision + 1}))} />;
    return <View key={this.state.revision} style={{flex: 1}}>{this.props.children}</View>;
  }
}
const styles = StyleSheet.create({
  screen: {flex: 1, justifyContent: "center", backgroundColor: "#F6F4F8", padding: 28, gap: 20},
  title: {color: "#24143A", fontSize: 25, lineHeight: 40, fontWeight: "700"},
  body: {color: "#615A6A", fontSize: 16, lineHeight: 27},
  button: {backgroundColor: "#24143A", padding: 16, minHeight: 52, borderRadius: 14, alignItems: "center"},
  buttonText: {color: "#FFFFFF", fontSize: 16, fontWeight: "600", fontFamily: Platform.OS === "ios" ? "System" : "sans-serif"}
});
