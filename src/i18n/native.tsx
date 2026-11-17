import { forwardRef, type ReactNode } from "react";
import { Pressable as NativePressable, Text as NativeText, TextInput as NativeTextInput, StyleSheet, type PressableProps, type TextProps, type TextInputProps, type TextStyle, type View } from "react-native";
import { useTextScale } from "../typography";
import { useI18n } from "./context";

function localizedStyle(style: TextStyle | undefined, text: string, isRTL: boolean): TextStyle {
  const script = /[\u0980-\u09FF]/.test(text) ? "Bengali" : /[\u0600-\u06FF]/.test(text) ? "Arabic" : null;
  const family = script === "Bengali" ? "AnekBangla" : "Tajawal";
  const weight = Number(style?.fontWeight) || Number(style?.fontFamily?.match(/_(\d{3})/)?.[1]) || 400;
  // Tajawal has no 600 face; use its real Bold font for semibold UI labels.
  const face = weight >= 800 ? "800ExtraBold" : weight >= 700 || (script === "Arabic" && weight >= 600) ? "700Bold" : weight >= 600 ? "600SemiBold" : weight >= 500 ? "500Medium" : "400Regular";
  const align = style?.textAlign;
  return {
    ...(!script && !style?.fontFamily ? {fontFamily: `BricolageGrotesque_${face}`, fontWeight: "normal" as const} : {}),
    ...(script ? { fontFamily: `${family}_${face}`, fontWeight: "normal", letterSpacing: 0,
      lineHeight: Math.max(style?.lineHeight ?? 0, (style?.fontSize ?? 14) * 1.6) } : {}),
    writingDirection: isRTL ? "rtl" : "ltr",
    textAlign: align === "center" || align === "justify" ? align : align === "right" ? isRTL ? "left" : "right" : isRTL ? "right" : "left"
  };
}

function scaleStyle(style: TextStyle | undefined, scale: number): TextStyle {
  return { ...style, fontSize: (style?.fontSize ?? 14) * scale,
    ...(style?.lineHeight !== undefined ? { lineHeight: style.lineHeight * scale } : {}) };
}

export const Text = forwardRef<NativeText, TextProps & { localize?: boolean; tabIndex?: number }>(function Text({ children, style, localize = true, accessibilityLabel, accessibilityHint, ...props }, ref) {
  const { t, isRTL } = useI18n();
  const scale = useTextScale();
  const translateChildren = (node: ReactNode): ReactNode => {
    if (typeof node === "string" || typeof node === "number") return localize ? t(String(node)) : node;
    if (Array.isArray(node)) {
      if (node.every(item => item == null || typeof item === "boolean" || typeof item === "string" || typeof item === "number")) {
        return translateChildren(node.filter(item => item != null && typeof item !== "boolean").join(""));
      }
      return node.map(translateChildren);
    }
    return node;
  };
  const content = translateChildren(children);
  const text = typeof content === "string" ? content : "";
  const scaled = scaleStyle(StyleSheet.flatten(style), scale);
  return <NativeText ref={ref} {...props} accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : undefined} accessibilityHint={accessibilityHint ? t(accessibilityHint) : undefined}
    style={[style, scaled, localizedStyle(scaled, text, isRTL)]}>{content}</NativeText>;
});

export const Pressable = forwardRef<View, PressableProps>(function Pressable({ accessibilityLabel, accessibilityHint, accessibilityState, ...props }, ref) {
  const { t } = useI18n();
  return <NativePressable ref={ref} {...props} accessibilityState={accessibilityState}
    aria-checked={props["aria-checked"] ?? accessibilityState?.checked}
    aria-busy={props["aria-busy"] ?? accessibilityState?.busy}
    aria-disabled={props["aria-disabled"] ?? accessibilityState?.disabled}
    aria-selected={props["aria-selected"] ?? accessibilityState?.selected}
    aria-expanded={props["aria-expanded"] ?? accessibilityState?.expanded}
    accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : undefined} accessibilityHint={accessibilityHint ? t(accessibilityHint) : undefined} />;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput({ style, accessibilityLabel, placeholder, ...props }, ref) {
  const { t, isRTL, language } = useI18n();
  const scale = useTextScale();
  const scaled = scaleStyle(StyleSheet.flatten(style), scale);
  const inputScript = props.value && /[\u0980-\u09FF\u0600-\u06FF]/.test(props.value) ? props.value : language === "bn" ? "বাংলা" : language === "ar" ? "عربي" : "";
  return <NativeTextInput ref={ref} {...props} accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : undefined} placeholder={placeholder ? t(placeholder) : undefined}
    style={[style, scaled, localizedStyle(scaled, inputScript, isRTL)]} />;
});
