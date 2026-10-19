import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";
import { EMPTY_TASBEEH, tasbeehReducer, TASBEEH_PRESETS } from "../services/tasbeeh";
import { loadTasbeehState, saveTasbeehState } from "../services/storage";

export function useTasbeeh() {
  const [state, dispatch] = useReducer(tasbeehReducer, EMPTY_TASBEEH);
  const [ready, setReady] = useState(false);
  const [loadIssue, setLoadIssue] = useState(false);
  const [loadRevision, setLoadRevision] = useState(0);
  const [saveIssue, setSaveIssue] = useState(false);
  const latest = useRef(state);
  const hydrated = useRef(false);
  useLayoutEffect(() => { latest.current = state; }, [state]);

  useEffect(() => {
    let mounted = true;
    void loadTasbeehState().then(saved => {
      if (mounted) { latest.current = saved; dispatch({ type: "restore", state: saved }); hydrated.current = true; setLoadIssue(false); setReady(true); }
    }).catch(() => { if (mounted) { setLoadIssue(true); } });
    const subscription = AppState.addEventListener("change", status => {
      if (status !== "active" && hydrated.current) void saveTasbeehState(latest.current).catch(() => { if (mounted) setSaveIssue(true); });
    });
    return () => {
      mounted = false;
      subscription.remove();
      if (hydrated.current) void saveTasbeehState(latest.current).catch(() => undefined);
    };
  }, [loadRevision]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = setTimeout(() => {
      void saveTasbeehState(state).then(() => { if (active) setSaveIssue(false); }).catch(() => { if (active) setSaveIssue(true); });
    }, 150);
    return () => { active = false; clearTimeout(timer); };
  }, [ready, state]);
  const selected = [...TASBEEH_PRESETS, ...state.custom].find(item => item.id === state.selectedId) ?? TASBEEH_PRESETS[0];
  return { state, dispatch, selected, count: state.counts[selected.id] ?? 0, ready, saveIssue, loadIssue, retryLoad: () => setLoadRevision(current => current + 1) };
}
