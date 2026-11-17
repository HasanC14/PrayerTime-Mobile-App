import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import type { PrayerReflection } from "../content/prayerReflections";
import type { PrayerJournalDays } from "../services/prayerJournal";
import { reflectionRepository } from "../services/reflectionHistory";
import { getWeeklyReflection } from "../services/weeklyReflection";

export function useWeeklyReflection(days: PrayerJournalDays, anchor: string, activeKey: string, startedOn: string | null) {
  const focused = useIsFocused();
  const {selection} = getWeeklyReflection(days, anchor, activeKey, startedOn);
  const {week, theme, allExempt, focusPrayer} = selection;
  const [resolved, setResolved] = useState<{key: string; reflection: PrayerReflection; saved: boolean} | null>(null);
  const key = `${week}|${theme}|${allExempt}|${focusPrayer ?? ""}`;
  useEffect(() => {
    if (!focused) return;
    let active = true;
    void reflectionRepository.resolve({week, theme, allExempt, focusPrayer}).then(result => {
      if (active) setResolved({key, ...result});
    });
    return () => { active = false; };
  }, [allExempt, focusPrayer, focused, key, theme, week]);
  return resolved?.key === key ? resolved : null;
}
