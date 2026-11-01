import { PRAYER_PASSAGES, type ReflectionTheme } from "../content/prayerReflections";
import type { PrayerJournalDays } from "./prayerJournal";
import { getJournalPeriodSummary } from "./journalOverview";

export function getWeeklyReflection(days: PrayerJournalDays, anchor: string, activeKey: string, startedOn: string | null) {
  const summary = getJournalPeriodSummary(days, anchor, "week", activeKey, startedOn);
  let theme: ReflectionTheme = "starting";
  let reason = "Keep recording to see your patterns.";
  let tip = "Check your prayer times and prepare for the next salah.";
  let prayer: string | undefined;
  if (summary.exemptDays > 0 && summary.dayCount === 0) {
    reason = "Exempt days are left out of your prayer totals.";
    tip = "Return to your journal when you are ready to resume.";
  } else if (summary.dayCount > 0 && summary.recorded === 0) {
    reason = "No prayers logged this week. There is not enough activity for a personalised reflection.";
    tip = "You can go back and record prayers you have already prayed.";
  } else if (summary.dayCount >= 2) {
    const rate = summary.recorded / summary.total;
    if (rate < .4) {
      theme = "returning";
      reason = "There were gaps in your journal this week. Make room for the next salah.";
    } else if (rate >= .8) {
      theme = "maintaining";
      reason = "You recorded most of your prayers this week. Keep protecting that routine.";
      tip = "Plan your day around all five prayers and keep your reminders enabled.";
    } else {
      theme = "consistency";
      reason = "Your journal shows a routine you can keep building on.";
      tip = "Look ahead at tomorrow’s prayer times and plan around the busiest part of your day.";
      const sorted = [...summary.prayers].sort((a, b) => a.recorded - b.recorded);
      // A tied minimum is not a meaningful prayer-specific pattern.
      if (summary.dayCount >= 3 && sorted[1].recorded - sorted[0].recorded >= 2) {
        prayer = sorted[0].prayer;
        reason = "{prayer} was recorded less often this week.";
        tip = prayer === "Fajr" ? "Prepare before bed and set an alarm for Fajr."
          : "Check the time for {prayer} and reserve a break before your day gets busy.";
      }
    }
  }
  const pool = PRAYER_PASSAGES.filter(passage => passage.themes.includes(theme));
  // Calendar-week rotation stays stable across reopens, with no server or journal
  // upload. Consecutive weeks in the same theme use different passages.
  const weekIndex = Math.floor(Date.parse(`${summary.start}T12:00:00Z`) / (7 * 86400000));
  const passage = pool[((weekIndex % pool.length) + pool.length) % pool.length];
  return {summary, theme, reason, tip, prayer, passage};
}
