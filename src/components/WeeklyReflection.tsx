import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { createThemedStyles } from "../theme";
import type { PrayerJournalController } from "../hooks/usePrayerJournal";
import { getWeeklyReflection } from "../services/weeklyReflection";
import { AppButton, SurfaceCard } from "./ui";

export function WeeklyReflection({journal, anchor, activeKey}: {journal: PrayerJournalController; anchor: string; activeKey: string}) {
  const {colors, styles} = useStyles();
  const {t, language} = useI18n();
  const [linkIssue, setLinkIssue] = useState(false);
  const reflection = getWeeklyReflection(journal.days, anchor, activeKey, journal.startedOn);
  const {passage} = reflection;
  return <View testID="journal-reflection"><SurfaceCard style={styles.card}>
    <View style={styles.heading}><Ionicons name="leaf-outline" size={18} color={colors.accent} /><Text style={styles.title}>Weekly reflection</Text></View>
    <Text style={styles.body}>{t(reflection.reason, {prayer: reflection.prayer ?? ""})}</Text>
    {language !== "en" ? <Text style={styles.caption}>Passage in English</Text> : null}
    <Text localize={false} style={styles.quote}>{`“${passage.text}”`}</Text>
    <Text localize={false} style={styles.reference}>{passage.reference}</Text>
    <Text localize={false} style={styles.caption}>{passage.attribution}</Text>
    <View style={styles.tip}><Text style={styles.tipTitle}>Try this</Text><Text style={styles.body}>{t(reflection.tip, {prayer: reflection.prayer ?? ""})}</Text></View>
    <AppButton label="Read in context" variant="quiet" onPress={() => {
      setLinkIssue(false);
      void Linking.openURL(passage.url).catch(() => setLinkIssue(true));
    }} />
    {linkIssue ? <Text style={styles.caption}>The source could not be opened. Please try again.</Text> : null}
  </SurfaceCard></View>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  card: {padding: 18, gap: 12},
  heading: {flexDirection: "row", alignItems: "center", gap: 8},
  title: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 16, color: colors.ink, flexShrink: 1},
  body: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 21, color: colors.inkSoft},
  quote: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 18, lineHeight: 28, color: colors.ink},
  reference: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, color: colors.accent},
  caption: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, lineHeight: 17, color: colors.inkSoft},
  tip: {backgroundColor: colors.accentSurface, borderRadius: 12, padding: 12, gap: 5},
  tipTitle: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, color: colors.accent},
}));
