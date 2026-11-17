let revision = 0;
export function recordRevision() {return revision;}
const listeners = new Set<() => void>();
export function onRecordsChanged(listener: () => void): () => void {listeners.add(listener); return () => {listeners.delete(listener);};}
export function notifyRecordsChanged() {revision++; for (const listener of listeners) listener();}
