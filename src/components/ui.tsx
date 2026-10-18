import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { createThemedStyles, radii, shadows, spacing } from "../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function AppBackground({ children }: { children: ReactNode }) {
  const { colors, styles } = useStyles();
  return (
    <LinearGradient colors={[colors.backgroundTint, colors.background]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 0.32 }} style={styles.fill}>
      {children}
    </LinearGradient>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const { colors, styles } = useStyles();
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
        selected && styles.iconButtonSelected,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

export function AppButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false,
  style
}: {
  label: string;
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
      accessibilityLabel={loading ? `${label}, in progress` : label}
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
        <Ionicons name="ellipsis-horizontal" size={20} color={primary ? colors.onPrimary : colors.ink} />
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
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmentWrap}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={String(option.id)}
            accessibilityRole="radio"
            accessibilityLabel={option.name}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(option.id)}
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
  onPress,
  trailing
}: {
  icon: IconName;
  title: string;
  value?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const { colors, styles } = useStyles();
  const content = (
    <>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} /> : null)}
    </>
  );

  if (!onPress) return <View style={styles.settingRow}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${value ? `, ${value}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
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
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48
  },
  iconButtonSelected: { backgroundColor: colors.surface },
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
  buttonText: { fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, fontWeight: "700" },
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
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  settingRowPressed: { backgroundColor: colors.surfaceMuted },
  settingIcon: {
    alignItems: "center",
    backgroundColor: colors.accentSurface,
    borderRadius: radii.md,
    height: 40,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 40
  },
  settingCopy: { flex: 1, paddingRight: spacing.md },
  settingTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 16, fontWeight: "600" },
  settingValue: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, marginTop: 3 },
  sectionTitle: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    marginTop: spacing.xxl
  }
}));
