import { useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { createThemedStyles } from "../theme";
import type { PrayerJournalController } from "../hooks/usePrayerJournal";
import type { PrayerReflection } from "../content/prayerReflections";
import { useWeeklyReflection } from "../hooks/useWeeklyReflection";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { SurfaceCard } from "./ui";

function ReflectionContext({reflection, onClose}: {reflection: PrayerReflection; onClose: () => void}) {
  const {styles} = useStyles();
  const {language} = useI18n();
  const insets = useSafeAreaInsets();
  const [linkIssue, setLinkIssue] = useState(false);
  const open = (url: string) => {
    setLinkIssue(false);
    void Linking.openURL(url).catch(() => setLinkIssue(true));
  };
  return <BottomSheetModal visible onClose={onClose} closeLabel="Close passage and context" sheetStyle={styles.sheet}>
    <SheetHeader title="Passage and context" subtitle={reflection.source.reference} onClose={onClose} />
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={[styles.contextContent, {paddingBottom: Math.max(insets.bottom, 20)}]}>
      <Text style={styles.caption}>{language === "en" ? "Quran translation excerpt" : "Quran translation excerpt · English"}</Text>
      <Text localize={false} selectable style={styles.quote}>{`“${reflection.source.excerpt}”`}</Text>
      <Text localize={false} style={styles.attribution}>{reflection.source.attribution}</Text>
      <Text accessibilityRole="header" style={styles.contextTitle}>Understanding the passage</Text>
      <Text style={styles.body}>{reflection.context}</Text>
      <Text style={styles.caption}>The explanation and practical suggestion are written by PrayerTime, separate from the Quran translation.</Text>
      <Text style={styles.sourceLine}>
        <Text accessibilityRole="link" onPress={() => open(reflection.source.url)} style={styles.reference}>Full passage on Quran.com</Text>
        {" · "}
        <Text accessibilityRole="link" onPress={() => open(reflection.source.tafsirUrl)} style={styles.reference}>Tafsir Ibn Kathir (abridged)</Text>
      </Text>
      {linkIssue ? <Text accessibilityLiveRegion="polite" style={styles.caption}>The source could not be opened. Please try again.</Text> : null}
    </ScrollView>
  </BottomSheetModal>;
}

export function WeeklyReflection({journal, anchor, activeKey}: {journal: PrayerJournalController; anchor: string; activeKey: string}) {
  const {colors, styles} = useStyles();
  const {t} = useI18n();
  const [openedReflection, setOpenedReflection] = useState<PrayerReflection | null>(null);
  const resolved = useWeeklyReflection(journal.days, anchor, activeKey, journal.startedOn);
  if (!resolved) return <SurfaceCard style={styles.card}><Text style={styles.caption}>Preparing your reflection…</Text></SurfaceCard>;
  const {reflection, saved} = resolved;
  return <View testID="journal-reflection">
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}><Ionicons name="leaf-outline" size={17} color={colors.accent} /><Text style={styles.eyebrow}>Weekly reflection</Text></View>
      <Text accessibilityRole="header" style={styles.title}>{reflection.title}</Text>
      <Text style={styles.body}>{reflection.explanation}</Text>
      <Text style={styles.action}>{reflection.action}</Text>
      {!saved ? <Text style={styles.caption}>Your reading history could not be saved. This reflection will stay the same while the app is open.</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={reflection.source.reference} accessibilityHint="Opens the passage and its context"
        onPress={() => setOpenedReflection(reflection)} style={styles.sourceLink}>
        <Text localize={false} style={styles.reference}>{t(reflection.source.reference)}</Text>
      </Pressable>
    </SurfaceCard>
    {openedReflection ? <ReflectionContext reflection={openedReflection} onClose={() => setOpenedReflection(null)} /> : null}
  </View>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  card: {padding: 18, gap: 12},
  heading: {flexDirection: "row", alignItems: "center", gap: 8},
  eyebrow: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, color: colors.inkSoft, flexShrink: 1},
  title: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 21, lineHeight: 28, color: colors.ink},
  body: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 14, lineHeight: 23, color: colors.inkSoft},
  action: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 14, lineHeight: 23, color: colors.ink},
  reference: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, color: colors.accent, textDecorationLine: "underline"},
  sourceLink: {minHeight: 44, justifyContent: "center", alignSelf: "flex-start"},
  sourceLine: {lineHeight: 24, color: colors.inkSoft},
  sheet: {alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "90%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20},
  scroll: {flexShrink: 1},
  contextContent: {gap: 14},
  contextTitle: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 16, color: colors.ink, marginTop: 8},
  quote: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 18, lineHeight: 28, color: colors.ink},
  attribution: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, lineHeight: 18, color: colors.inkSoft},
  caption: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, lineHeight: 18, color: colors.inkSoft},
}));
