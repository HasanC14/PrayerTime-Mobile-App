import {useContext} from "react";
import {SheetFocusContext} from "./SheetFocusContext";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "../i18n/native";
import { createThemedStyles } from "../theme";
import { IconButton } from "./ui";

export function SheetHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  const { styles } = useStyles();
  const headingRef = useContext(SheetFocusContext);
  return <>
    <View style={styles.handle} />
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text ref={headingRef ?? undefined} tabIndex={Platform.OS === "web" ? -1 : undefined} accessible accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <IconButton icon="close" label={`Close ${title}`} onPress={onClose} />
    </View>
  </>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.sheetHandle, alignSelf: "center", marginTop: 10, marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 23, letterSpacing: -0.5 },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19, marginTop: 5 }
}));
