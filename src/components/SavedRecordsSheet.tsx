import {useRef, useState} from "react";
import {ScrollView, StyleSheet, Text as NativeText, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Text} from "../i18n/native";
import {createThemedStyles} from "../theme";
import {BottomSheetModal} from "./BottomSheetModal";
import {SheetHeader} from "./SheetHeader";
import {AppButton} from "./ui";
import {shareRecordBackup, restoreRecordBackup, recoverUnreadableRecords} from "../services/recordBackupDevice";
import {getDiagnostics} from "../services/diagnostics";

export function SavedRecordsSheet({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const {styles} = useStyles();
  const insets = useSafeAreaInsets();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);
  async function run(work: () => Promise<unknown>, success: string) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setMessage(null);
    try {const result = await work(); if (result !== false) setMessage(success);}
    catch {setMessage("The operation could not be completed. Your existing records have been kept.");}
    finally {busyRef.current = false; setBusy(false);}
  }
  return <BottomSheetModal visible={visible} onClose={onClose} closeLabel="Close saved records" sheetStyle={styles.sheet}>
    <SheetHeader title="Saved records" onClose={onClose} />
    <ScrollView style={{flexShrink: 1}} contentContainerStyle={{gap: 16, paddingBottom: Math.max(insets.bottom, 20)}}>
      <Text style={styles.body}>Export your journal and Tasbeeh counters as a private backup file. Keep it somewhere safe. Location and notification schedules are excluded.</Text>
      <AppButton label="Export records" icon="download-outline" disabled={busy} onPress={() => void run(shareRecordBackup, "Backup is ready.")} />
      <Text style={styles.body}>Import merges records with this device. Existing journal entries are kept, and counter totals use the higher saved value.</Text>
      <AppButton label="Import backup" icon="document-outline" variant="secondary" disabled={busy} onPress={() => void run(restoreRecordBackup, "Records imported.")} />
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
      <AppButton label="Recover unreadable records" variant="quiet" disabled={busy} onPress={() => setConfirmRecovery(true)} />
      {confirmRecovery ? <View style={styles.recovery}>
        <Text style={styles.body}>Unreadable values will be preserved in a local archive before resetting only those values. Healthy records stay unchanged. Export first if you want a separate copy.</Text>
        <AppButton label="Preserve and recover" disabled={busy} onPress={() => void run(async () => {await recoverUnreadableRecords(); setConfirmRecovery(false);}, "Recovery completed.")} />
        <AppButton label="Cancel" variant="quiet" disabled={busy} onPress={() => setConfirmRecovery(false)} />
      </View> : null}
      <AppButton label="Device diagnostics" variant="quiet" onPress={() => setDiagnostics(value => !value)} />
      {diagnostics ? <>
        <Text style={styles.body}>These local checks contain status and timing only. They are not uploaded and do not include your journal, location, or searches.</Text>
        <NativeText selectable style={styles.diagnostics}>{JSON.stringify(getDiagnostics(), null, 2)}</NativeText>
      </> : null}
    </ScrollView>
  </BottomSheetModal>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: {alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "90%", backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20},
  body: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 14, lineHeight: 23, color: colors.inkSoft},
  message: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 14, lineHeight: 23, color: colors.accent},
  recovery: {gap: 12, padding: 14, backgroundColor: colors.surfaceMuted, borderRadius: 16},
  diagnostics: {fontFamily: "BricolageGrotesque_400Regular", writingDirection: "ltr", textAlign: "left", fontSize: 11, lineHeight: 18, color: colors.inkSoft}
}));
