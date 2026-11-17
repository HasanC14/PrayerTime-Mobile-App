export type DiagnosticArea = "background-refresh" | "widgets" | "render" | "startup" | "storage";
export type DiagnosticOutcome = "success" | "failed" | "unavailable";
export interface DiagnosticEvent {area: DiagnosticArea; outcome: DiagnosticOutcome; at: number; durationMs?: number;}
const events: DiagnosticEvent[] = [];
// Local, bounded and deliberately unable to accept messages, coordinates or records.
export function recordDiagnostic(area: DiagnosticArea, outcome: DiagnosticOutcome, durationMs?: number) {
  events.push({area, outcome, at: Date.now(), ...(durationMs !== undefined && Number.isFinite(durationMs) ? {durationMs: Math.max(0, Math.round(durationMs))} : {})});
  if (events.length > 30) events.splice(0, events.length - 30);
}
export function getDiagnostics(): readonly DiagnosticEvent[] {return events.map(event => ({...event}));}
