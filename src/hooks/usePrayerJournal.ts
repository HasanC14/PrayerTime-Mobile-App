import { useCallback, useEffect, useRef, useState } from "react";
import type { PrayerName } from "../types";
import { canRecordPrayer, prayerJournalRepository, type PrayerJournalDays, type PrayerJournalEntry } from "../services/prayerJournal";
import { selectionFeedback } from "../utils/feedback";

type Write = { dateKey: string; prayer: PrayerName; entry: PrayerJournalEntry | null } | {dateKey: string; exempt: boolean};
export type PrayerJournalController = ReturnType<typeof usePrayerJournal>;

export function usePrayerJournal(enabled: boolean, dateKey: string | null) {
  const [days, setDays] = useState<PrayerJournalDays>({});
  const [startedOn, setStartedOn] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadIssue, setLoadIssue] = useState(false);
  const [saveIssue, setSaveIssue] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const mounted = useRef(true);
  const hydrated = useRef(false);
  const latest = useRef<PrayerJournalDays>({});
  const pending = useRef<Write | null>(null);
  const failed = useRef<Write | null>(null);
  useEffect(() => { mounted.current = true;return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!enabled || !dateKey || hydrated.current) return;
    let active = true;
    void prayerJournalRepository.open(dateKey).then(value => {
      if (!active) return;
      latest.current = value.days;
      hydrated.current = true;
      setDays(value.days);setStartedOn(value.startedOn);setReady(true);setLoadIssue(false);
    }).catch(() => { if (active) setLoadIssue(true); });
    return () => { active = false; };
  }, [dateKey, enabled, loadRevision]);

  const write = useCallback(async (operation: Write) => {
    if (pending.current || !hydrated.current) return;
    pending.current = operation;
    setBusyKey(`${operation.dateKey}:${"exempt" in operation ? "exempt" : operation.prayer}`);
    try {
      const day = "exempt" in operation
        ? await prayerJournalRepository.setExempt(operation.dateKey, operation.exempt)
        : await prayerJournalRepository.set(operation.dateKey, operation.prayer, operation.entry);
      latest.current = {...latest.current, [operation.dateKey]: day};
      failed.current = null;
      if (mounted.current) {setDays(latest.current);setSaveIssue(false);selectionFeedback();}
    } catch {
      failed.current = operation;
      if (mounted.current) setSaveIssue(true);
    } finally {
      pending.current = null;
      if (mounted.current) setBusyKey(null);
    }
  }, []);

  const toggle = useCallback((dateKey: string, prayer: PrayerName, start: Date | undefined, now: Date, timeZone: string) => {
    if (!enabled || !hydrated.current || pending.current) return;
    if (latest.current[dateKey]?.exempt) return;
    const recorded = Boolean(latest.current[dateKey]?.[prayer]);
    if (!canRecordPrayer(start, now, recorded)) return;
    void write({dateKey, prayer, entry: recorded ? null : {completedAt: now.getTime(), timeZone}});
  }, [enabled, write]);

  const toggleExempt = useCallback((selectedKey: string) => {
    if (!enabled || !hydrated.current || pending.current || !dateKey || selectedKey > dateKey) return;
    void write({dateKey: selectedKey, exempt: !latest.current[selectedKey]?.exempt});
  }, [dateKey, enabled, write]);

  return {days, startedOn, ready, loadIssue, saveIssue, busyKey, toggle, toggleExempt,
    retryLoad: () => setLoadRevision(value => value + 1),
    retrySave: () => { if (failed.current) void write(failed.current); },
  };
}
