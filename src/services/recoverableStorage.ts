export interface RecoveryStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}
export class DamagedSavedDataError extends Error {
  constructor(public readonly key: string) {super("Saved data could not be read. The original has been preserved."); this.name = "DamagedSavedDataError";}
}
export function readSavedObject(raw: string | null, key: string): Record<string, unknown> | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {throw new DamagedSavedDataError(key);}
}
// Archive first. A failed archive never deletes the only copy of a user's data.
export async function archiveDamagedValues(storage: RecoveryStorage, keys: readonly string[], now = Date.now()): Promise<number> {
  let count = 0;
  for (const key of keys) {
    const raw = await storage.getItem(key);
    try {readSavedObject(raw, key);}
    catch (error) {
      if (!(error instanceof DamagedSavedDataError) || raw === null) throw error;
      await storage.setItem(`@PrayerTime:v2:recovery:${now}:${encodeURIComponent(key)}`, raw);
      await storage.removeItem(key);
      count++;
    }
  }
  return count;
}
