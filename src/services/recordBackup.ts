import {isJournalDateKey, readJournalDay, JOURNAL_PREFIX, JOURNAL_STARTED_ON_KEY} from "./prayerJournal";
import {validateTasbeehState} from "./tasbeeh";
import {readSavedObject} from "./recoverableStorage";

const COUNTER = "@PrayerTime:v2:tasbeeh";
const RECOVERY = "@PrayerTime:v2:recovery:";
export const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
interface BackupStorage {
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: string[]): Promise<readonly (readonly [string, string | null])[]>;
  setItem(key: string, value: string): Promise<unknown>;
}
// Preference/location recovery archives must stay on the device, too.
const recordArchive = (key: string) => ["journal:", "before-import:", "import:", "unreadable:"].some(prefix => key.startsWith(RECOVERY + prefix)) || key.startsWith(RECOVERY) && key.endsWith(":" + encodeURIComponent(COUNTER));
const allowed = (key: string) => key === COUNTER || key === JOURNAL_STARTED_ON_KEY || recordArchive(key) || key.startsWith(JOURNAL_PREFIX) && isJournalDateKey(key.slice(JOURNAL_PREFIX.length));
function validateLiveRecord(key: string, raw: string) {
  if (key === JOURNAL_STARTED_ON_KEY) {if (!isJournalDateKey(raw)) throw new Error("Invalid journal date.");}
  else if (key === COUNTER) {
    const parsed = readSavedObject(raw, key);
    if (!parsed || !Array.isArray(parsed.custom) || !parsed.counts || typeof parsed.counts !== "object" || Array.isArray(parsed.counts)) throw new Error("Invalid counter backup.");
  } else readJournalDay(raw);
}
export interface RecordBackup {format: "PrayerTime records"; version: 1; exportedAt: string; entries: Record<string, string>;}
export class RecordImportWriteError extends Error {
  constructor() {super("Import was interrupted. Previous values are archived."); this.name = "RecordImportWriteError";}
}
export function parseRecordBackup(text: string): RecordBackup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error("Backup is too large.");
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object") throw new Error("Invalid backup.");
  const backup = value as RecordBackup;
  if (backup.format !== "PrayerTime records" || backup.version !== 1 || !backup.entries || typeof backup.entries !== "object" || Array.isArray(backup.entries)) throw new Error("Unsupported backup format.");
  const entries = Object.entries(backup.entries);
  if (entries.length > 20000) throw new Error("Backup has too many records.");
  for (const [key, raw] of entries) {
    if (!allowed(key) || typeof raw !== "string") throw new Error("Backup contains unsupported data.");
    // Preserve archived bytes for recovery. They are never loaded as live state.
    if (key.startsWith(RECOVERY)) continue;
    validateLiveRecord(key, raw);
  }
  return backup;
}
export async function exportRecordBackup(storage: BackupStorage): Promise<string> {
  const keys = (await storage.getAllKeys()).filter(allowed).sort();
  const rows = keys.length ? await storage.multiGet(keys) : [];
  const entries: Record<string, string> = {};
  for (const [key, raw] of rows) {
    if (raw === null) continue;
    if (recordArchive(key)) {entries[key] = raw; continue;}
    try {validateLiveRecord(key, raw); entries[key] = raw;}
    catch {entries[`${RECOVERY}unreadable:${encodeURIComponent(key)}`] = raw;}
  }
  const backup: RecordBackup = {format: "PrayerTime records", version: 1, exportedAt: new Date().toISOString(), entries};
  const text = JSON.stringify(backup, null, 2);
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error("Backup is too large.");
  return text;
}
// Merge only: settings, location and notification schedules are never imported.
// Confirmed current entries win conflicts. Persist the previous values before
// changing anything so an interrupted import has a recoverable local snapshot.
export async function importRecordBackup(storage: BackupStorage, text: string): Promise<number> {
  const backup = parseRecordBackup(text);
  const keys = Object.keys(backup.entries).filter(key => !key.startsWith(RECOVERY));
  const current = new Map(keys.length ? await storage.multiGet(keys) : []);
  const changes: [string, string][] = [];
  for (const key of keys) {
    const raw = backup.entries[key];
    const previous = current.get(key);
    if (previous === null || previous === undefined) {changes.push([key, raw]); continue;}
    if (key === JOURNAL_STARTED_ON_KEY) {
      if (!isJournalDateKey(previous)) throw new Error("Repair unreadable records before importing.");
      changes.push([key, previous < raw ? previous : raw]);
    } else if (key === COUNTER) {
      validateLiveRecord(key, previous);
      const existing = validateTasbeehState(JSON.parse(previous));
      const incoming = validateTasbeehState(JSON.parse(raw));
      const custom = [...existing.custom, ...incoming.custom.filter(item => !existing.custom.some(saved => saved.id === item.id))];
      const counts = {...incoming.counts, ...existing.counts};
      for (const [id, count] of Object.entries(incoming.counts)) counts[id] = Math.max(counts[id] ?? 0, count);
      changes.push([key, JSON.stringify(validateTasbeehState({...existing, custom, counts}))]);
    } else {
      const existing = readJournalDay(previous);
      const incoming = readJournalDay(raw);
      const {exempt: _importedExempt, ...incomingEntries} = incoming;
      const {exempt, ...existingEntries} = existing;
      changes.push([key, JSON.stringify({version: 1, entries: {...incomingEntries, ...existingEntries}, ...(exempt ? {exempt: true} : {})})]);
    }
  }
  const stamp = Date.now();
  for (const [key, raw] of Object.entries(backup.entries)) {
    if (recordArchive(key)) changes.push([`${RECOVERY}import:${stamp}:${encodeURIComponent(key)}`, raw]);
  }
  if (!changes.length) return 0;
  await storage.setItem(`${RECOVERY}before-import:${stamp}`, JSON.stringify({version: 1, entries: Object.fromEntries(current)}));
  try {for (const [key, raw] of changes) await storage.setItem(key, raw);}
  catch {throw new RecordImportWriteError();}
  return changes.length;
}
