import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import { createThemedStyles } from "../theme";

export function StorageIssueNotice({ onRetry }: { onRetry: () => void }) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  return <View style={[styles.notice, { bottom: insets.bottom + 88 }]}>
    <Text accessibilityLiveRegion="polite" style={styles.message}>{"Changes aren't saved yet. Please retry."}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Retry saving" onPress={onRetry} style={styles.retry}>
      <Text style={styles.retryText}>Retry saving</Text>
    </Pressable>
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  notice: { position: "absolute", start: 16, end: 16, zIndex: 20, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 16, backgroundColor: colors.warningSurface, borderWidth: 1, borderColor: colors.warningBorder },
  message: { flex: 1, color: colors.warningText, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.surface },
  retryText: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 12 },
}));
