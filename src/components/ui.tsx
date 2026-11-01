import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable, Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createThemedStyles, radii, shadows, spacing } from "../theme";
import { useI18n } from "../i18n/context";
import { selectionFeedback } from "../utils/feedback";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function AppBackground({ children }: { children: ReactNode }) {
  const { colors, styles } = useStyles();
  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

export function ScreenHeader({ title, subtitle, subtitleLines = 1, leading, action }: {
  title: string; subtitle?: string; subtitleLines?: number; leading?: ReactNode; action?: ReactNode;
}) {
  const { styles } = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screenHeader, { paddingTop: insets.top + 12 }]}>
      {leading}
      <View style={styles.headerCopy}>
        <Text accessibilityRole="header" style={styles.screenTitle}>{title}</Text>
        {subtitle ? <Text numberOfLines={subtitleLines} style={styles.screenSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SettingsGroup({ children }: { children: ReactNode }) {
  const { styles } = useStyles();
  return <View style={styles.settingsGroup}>{children}</View>;
}

export function RowDivider() {
  const { colors } = useStyles();
  const { isRTL } = useI18n();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, [isRTL ? "marginRight" : "marginLeft"]: 60 }} />;
}

export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
  variant = "outlined"
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  variant?: "outlined" | "plain";
}) {
  const { colors, styles } = useStyles();
  const { isRTL } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      android_ripple={{ color: "rgba(90,45,124,0.12)", borderless: true }}
      style={({ pressed }) => [
        styles.iconButton,
        variant === "plain" && styles.iconButtonPlain,
        selected && styles.iconButtonSelected,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Ionicons name={isRTL && icon === "arrow-back" ? "arrow-forward" : icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

export function AppButton({
  label,
  accessibilityLabel,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false,
  style
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, styles } = useStyles();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loading ? `${accessibilityLabel ?? label}, in progress` : accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      android_ripple={{ color: primary ? "rgba(255,255,255,0.14)" : "rgba(90,45,124,0.10)" }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : variant === "secondary" ? styles.buttonSecondary : styles.buttonQuiet,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={primary ? colors.onPrimary : colors.ink} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={primary ? colors.onPrimary : colors.ink} />
      ) : null}
      <Text style={[styles.buttonText, primary ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export function SurfaceCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { styles } = useStyles();
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  label
}: {
  options: readonly { id: string | number; name: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  label: string;
}) {
  const { styles } = useStyles();
  const { t } = useI18n();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t(label)} style={styles.segmentWrap}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={String(option.id)}
            accessibilityRole="radio"
            accessibilityLabel={option.name}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => { selectionFeedback(); onChange(option.id); }}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SettingRow({
  icon,
  title,
  value,
  subtitle,
  onPress,
  trailing,
  disabled = false
}: {
  icon: IconName;
  title: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  disabled?: boolean;
}) {
  const { colors, styles } = useStyles();
  const { t, isRTL } = useI18n();
  const content = (
    <>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text numberOfLines={2} style={styles.settingValue}>{value}</Text> : null}
      {trailing ?? (onPress ? <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.muted} /> : null)}
    </>
  );

  if (!onPress) return <View accessible={disabled || undefined} accessibilityLabel={disabled ? `${t(title)}${value ? `, ${t(value)}` : ""}` : undefined} accessibilityState={disabled ? {disabled: true} : undefined} aria-disabled={disabled || undefined} style={styles.settingRow}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t(title)}${value ? `, ${t(value)}` : ""}`}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => { selectionFeedback(); onPress(); }}
      android_ripple={{ color: colors.selectedSurface }}
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed, disabled && styles.disabled]}
    >
      {content}
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { styles } = useStyles();
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  fill: { flex: 1 },
  screenHeader: { alignSelf: "center", width: "100%", maxWidth: 660, paddingHorizontal: 20, paddingBottom: 18, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.background },
  headerCopy: { flex: 1, minWidth: 0 },
  screenTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 30, letterSpacing: -0.8 },
  screenSubtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, marginTop: 3 },
  settingsGroup: { backgroundColor: colors.surface, borderRadius: 20, overflow: "hidden" },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44
  },
  iconButtonSelected: { backgroundColor: colors.surface },
  iconButtonPlain: { backgroundColor: "transparent", borderWidth: 0 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    overflow: "hidden",
    paddingHorizontal: spacing.xl
  },
  buttonPrimary: { backgroundColor: colors.primaryButton },
  buttonSecondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderWidth: 1 },
  buttonQuiet: { backgroundColor: colors.surfaceMuted },
  buttonPressed: { transform: [{ scale: 0.99 }] },
  buttonText: { flexShrink: 1, textAlign: "center", paddingVertical: 10, fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, fontWeight: "700" },
  buttonTextPrimary: { color: colors.onPrimary },
  buttonTextSecondary: { color: colors.ink },
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    ...shadows.card
  },
  segmentWrap: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs
  },
  segment: {
    alignItems: "center",
    borderRadius: radii.sm,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  segmentSelected: { backgroundColor: colors.surface, ...shadows.card },
  segmentText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 14, fontWeight: "600" },
  segmentTextSelected: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontWeight: "700" },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 62,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: 10
  },
  settingRowPressed: { backgroundColor: colors.surfaceMuted },
  settingIcon: {
    alignItems: "center",
    backgroundColor: colors.accentSurface,
    borderRadius: 9,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  settingCopy: { flex: 1, minWidth: 0 },
  settingTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15 },
  settingSubtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 17, marginTop: 3 },
  settingValue: { maxWidth: "43%", color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, textAlign: "right", lineHeight: 18 },
  sectionTitle: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginStart: spacing.md,
    marginTop: spacing.xxl
  }
}));
