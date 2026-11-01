import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createThemedStyles, radii, spacing } from "../theme";
import { BottomSheetModal } from "./BottomSheetModal";
import { SheetHeader } from "./SheetHeader";
import { TextSizeControl } from "./TextSizeControl";

export function TextSizeSheet({ visible, value, onChange, onClose }: {
  visible: boolean; value: number; onChange: (value: number) => void; onClose: () => void;
}) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  return <BottomSheetModal visible={visible} closeLabel="Close text size" onClose={onClose}
    sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
    <SheetHeader title="Text size" onClose={onClose} />
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <TextSizeControl value={value} onChange={onChange} showTitle={false} />
    </ScrollView>
  </BottomSheetModal>;
}
const useStyles = createThemedStyles(colors => StyleSheet.create({
  sheet: { alignSelf: "center", width: "100%", maxWidth: 620, maxHeight: "86%", backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingHorizontal: spacing.xl },
  scroll: { flexShrink: 1 }
}));
