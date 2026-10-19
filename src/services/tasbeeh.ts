export interface TasbeehDefinition {
  id: string;
  name: string;
  target: number;
}

export const TASBEEH_PRESETS: readonly TasbeehDefinition[] = [
  { id: "general", name: "General", target: 100 },
  { id: "subhanallah", name: "SubhanAllah", target: 33 },
  { id: "alhamdulillah", name: "Alhamdulillah", target: 33 },
  { id: "allahu-akbar", name: "Allahu Akbar", target: 33 },
  { id: "astaghfirullah", name: "Astaghfirullah", target: 100 }
];
export const MAX_CUSTOM_TASBEEHS = 50;
export const MAX_TASBEEH_COUNT = 999_999;
export interface TasbeehState {
  selectedId: string;
  custom: TasbeehDefinition[];
  counts: Record<string, number>;
}
export const EMPTY_TASBEEH: TasbeehState = { selectedId: "general", custom: [], counts: {} };

export function validateTasbeehState(value: unknown): TasbeehState {
  if (!value || typeof value !== "object") return { ...EMPTY_TASBEEH };
  const saved = value as Record<string, unknown>;
  const usedIds = new Set(TASBEEH_PRESETS.map(item => item.id));
  const custom: TasbeehDefinition[] = [];
  if (Array.isArray(saved.custom)) for (const item of saved.custom) {
    if (custom.length >= MAX_CUSTOM_TASBEEHS) break;
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !/^custom-[a-z0-9-]{1,80}$/.test(item.id) || usedIds.has(item.id)) continue;
    if (typeof item.name !== "string" || !item.name.trim() || !Number.isInteger(item.target) || item.target < 1 || item.target > 99_999) continue;
    usedIds.add(item.id);
    custom.push({ id: item.id, name: item.name.trim().slice(0, 80), target: item.target });
  }
  const rawCounts = saved.counts && typeof saved.counts === "object" ? saved.counts as Record<string, unknown> : {};
  const counts: Record<string, number> = {};
  for (const id of usedIds) {
    const count = rawCounts[id];
    if (typeof count === "number" && Number.isFinite(count) && count >= 0) counts[id] = Math.min(MAX_TASBEEH_COUNT, Math.floor(count));
  }
  return { selectedId: typeof saved.selectedId === "string" && usedIds.has(saved.selectedId) ? saved.selectedId : "general", custom, counts };
}
export type TasbeehAction =
  | { type: "restore"; state: TasbeehState }
  | { type: "select"; id: string }
  | { type: "increment" | "undo" | "reset" }
  | { type: "add"; definition: TasbeehDefinition }
  | { type: "delete"; id: string };

export function tasbeehReducer(state: TasbeehState, action: TasbeehAction): TasbeehState {
  if (action.type === "restore") return validateTasbeehState(action.state);
  if (action.type === "select") return [...TASBEEH_PRESETS, ...state.custom].some(item => item.id === action.id) ? { ...state, selectedId: action.id } : state;
  if (action.type === "add") {
    if (state.custom.length >= MAX_CUSTOM_TASBEEHS || [...TASBEEH_PRESETS, ...state.custom].some(item => item.id === action.definition.id)) return state;
    const next = validateTasbeehState({ ...state, selectedId: action.definition.id, custom: [...state.custom, action.definition] });
    return next.custom.length === state.custom.length + 1 ? next : state;
  }
  if (action.type === "delete") {
    if (!state.custom.some(item => item.id === action.id)) return state;
    const counts = { ...state.counts }; delete counts[action.id];
    return { ...state, counts, custom: state.custom.filter(item => item.id !== action.id), selectedId: state.selectedId === action.id ? "general" : state.selectedId };
  }
  const previous = state.counts[state.selectedId] ?? 0;
  const count = action.type === "increment" ? Math.min(MAX_TASBEEH_COUNT, previous + 1) : action.type === "undo" ? Math.max(0, previous - 1) : 0;
  return count === previous ? state : { ...state, counts: { ...state.counts, [state.selectedId]: count } };
}
