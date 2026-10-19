import { createContext, useContext, type ReactNode } from "react";

export const MIN_TEXT_SCALE = 0.9;
export const MAX_TEXT_SCALE = 1.4;
export const TEXT_SCALE_STEP = 0.05;

export function normalizeTextScale(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.round(Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, value)) * 20) / 20;
}

const TextScaleContext = createContext(1);
export function TextScaleProvider({ value, children }: { value: number; children: ReactNode }) {
  return <TextScaleContext.Provider value={normalizeTextScale(value)}>{children}</TextScaleContext.Provider>;
}
export function useTextScale() { return useContext(TextScaleContext); }
