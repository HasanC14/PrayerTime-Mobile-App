import type { ReflectionTheme } from "../content/prayerReflections";
import { PRAYER_NAMES } from "../types";
import type { PrayerJournalDays } from "./prayerJournal";
import { getJournalPeriodSummary } from "./journalOverview";
import { chooseReflection, validateReflectionHistory, type ReflectionHistory, type ReflectionSelection } from "./reflectionHistory";

export function getWeeklyReflection(days: PrayerJournalDays, anchor: string, activeKey: string, startedOn: string | null, history?: ReflectionHistory) {
  const summary = getJournalPeriodSummary(days, anchor, "week", activeKey, startedOn);
  const allExempt = summary.exemptDays > 0 && summary.dayCount === 0;
  let theme: ReflectionTheme = "starting";
  if (summary.dayCount >= 2 && summary.recorded > 0) {
    const rate = summary.recorded / summary.total;
    theme = rate < .4 ? "returning" : rate >= .8 ? "maintaining" : "consistency";
  }
  // A relative logging gap can inform a practical topic, but cannot establish
  // that a prayer was missed or measure a person's faith.
  const counts = [...summary.prayers].sort((a, b) => a.recorded - b.recorded);
  const focusPrayer = summary.dayCount >= 3 && summary.recorded > 0 && counts[1].recorded - counts[0].recorded >= 2
    && PRAYER_NAMES.includes(counts[0].prayer) ? counts[0].prayer : undefined;
  const selection: ReflectionSelection = {week: summary.start, theme, allExempt, focusPrayer};
  const chosen = chooseReflection(selection, history ?? validateReflectionHistory(null));
  return {summary, theme, allExempt, selection, ...chosen, action: chosen.reflection.action};
}
