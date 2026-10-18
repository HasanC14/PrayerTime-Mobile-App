import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal } from "./BottomSheetModal";
import { AppButton } from "./ui";
import { createThemedStyles, radii, spacing } from "../theme";

export function PrivacySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  const policyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
  return (
    <BottomSheetModal visible={visible} closeLabel="Close privacy information" onClose={onClose} sheetStyle={styles.sheet}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <Text accessibilityRole="header" style={styles.title}>Your location & privacy</Text>
        <Text style={styles.body}>PrayerTime uses your location, with your permission, to calculate prayer times and Qibla direction. Automatic location updates run while you use the app and stop in the background. You can choose a city manually instead.</Text>
        <Text style={styles.body}>Coordinates are sent to LocationIQ to find a city name. Manual city searches are also sent to LocationIQ. Prayer calculations run on your phone and work offline once a location is selected. City names and search need an internet connection.</Text>
        <Text style={styles.body}>Your chosen location, up to five recent locations, alarm preferences, and settings are saved on this device. Uninstalling the app clears this local data. PrayerTime does not require an account.</Text>
        <Text style={styles.body}>Notification permission is optional and is used for the prayer reminders you enable. Your phone’s notification and battery settings can affect their delivery.</Text>
        <View style={styles.actions}>
          {policyUrl && /^https:\/\//i.test(policyUrl) ? <AppButton label="Read privacy policy" variant="secondary" onPress={() => void Linking.openURL(policyUrl).catch(() => undefined)} /> : null}
          <AppButton label="Done" onPress={onClose} />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, maxHeight: "85%" },
  content: { padding: spacing.xl },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 24, marginBottom: spacing.md },
  body: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 15, lineHeight: 23, marginBottom: spacing.md },
  actions: { gap: spacing.md, marginTop: spacing.md }
}));
