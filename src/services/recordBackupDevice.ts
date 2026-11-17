import {Platform} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {exportRecordBackup, importRecordBackup, MAX_BACKUP_BYTES, RecordImportWriteError} from "./recordBackup";
import {notifyRecordsChanged} from "./recordChanges";
import {recoverDamagedPreferences, withSavedStorageLock} from "./storage";
import {prayerJournalRepository} from "./prayerJournal";

export async function shareRecordBackup() {
  const text = await prayerJournalRepository.withStorageLock(() => withSavedStorageLock(() => exportRecordBackup(AsyncStorage)));
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([text], {type: "application/json"}));
    const link = document.createElement("a"); link.href = url; link.download = "prayertime-records.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  const {File, Paths} = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  if (!await Sharing.isAvailableAsync()) throw new Error("Sharing is unavailable.");
  const file = new File(Paths.cache, "prayertime-records.json"); file.write(text);
  try {await Sharing.shareAsync(file.uri, {mimeType: "application/json", UTI: "public.json", dialogTitle: "Export records"});}
  finally {if (file.exists) file.delete();}
}
export async function restoreRecordBackup(): Promise<boolean> {
  const {getDocumentAsync} = await import("expo-document-picker");
  const result = await getDocumentAsync({type: ["application/json", "text/plain"], copyToCacheDirectory: true});
  if (result.canceled) return false;
  const asset = result.assets[0];
  if (Platform.OS === "web" && asset.size && asset.size > MAX_BACKUP_BYTES) throw new Error("Backup is too large.");
  let text: string;
  if (Platform.OS === "web") {
    if (!asset.file) throw new Error("Backup could not be read.");
    text = await asset.file.text();
  } else {
    const {File} = await import("expo-file-system");
    const file = new File(asset.uri);
    try {
      if ((asset.size ?? 0) > MAX_BACKUP_BYTES || file.size > MAX_BACKUP_BYTES) throw new Error("Backup is too large.");
      text = await file.text();
    } finally {if (file.exists) file.delete();}
  }
  await prayerJournalRepository.withStorageLock(() => withSavedStorageLock(async () => {
    try {await importRecordBackup(AsyncStorage, text);}
    catch (error) {if (error instanceof RecordImportWriteError) notifyRecordsChanged(); throw error;}
    notifyRecordsChanged();
  }));
  return true;
}

export async function recoverUnreadableRecords(): Promise<void> {
  await recoverDamagedPreferences();
  await prayerJournalRepository.recover();
  notifyRecordsChanged();
}
