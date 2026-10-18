import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "./BottomSheetModal";
import { AppButton } from "./ui";
import { NotificationControls, type NotificationControlProps } from "./NotificationControls";
import { createThemedStyles, radii, spacing } from "../theme";

export function NotificationSetupSheet({ visible, onDismiss, ...controls }: NotificationControlProps & { visible: boolean; onDismiss: () => void }) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal visible={visible} onClose={onDismiss} closeLabel="Set up reminders later" sheetStyle={styles.sheet}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
        <Text accessibilityRole="header" style={styles.title}>Enable prayer reminders</Text>
        <Text style={styles.intro}>Get a reminder before your selected prayer periods end. Tap Enable reminders to allow notifications on your phone.</Text>
        <NotificationControls {...controls} />
        <AppButton label="Not now" variant="quiet" onPress={onDismiss} />
      </ScrollView>
    </BottomSheetModal>
  );
}
const useStyles = createThemedStyles((colors) => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "90%", backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 25, marginBottom: spacing.sm },
  intro: { color: colors.inkSoft, fontSize: 15, lineHeight: 22 }
}));
