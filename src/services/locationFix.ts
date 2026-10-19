import { DeviceLocationError } from "./locationErrors";

export interface PositionFix {
  coords: { latitude: number; longitude: number; accuracy?: number | null };
  timestamp: number;
}
type Subscription = { remove: () => void };

export function waitForLocationFix<T extends PositionFix>(
  subscribe: (onFix: (fix: T) => void, onError: (error: unknown) => void) => Promise<Subscription>,
  timeoutMs: number,
  signal?: AbortSignal,
  now = Date.now()
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let subscription: Subscription | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const remove = (watcher?: Subscription) => {
      // A native cleanup failure must not leave the caller waiting forever.
      try { watcher?.remove(); } catch { /* The request has already finished. */ }
    };
    const finish = (error?: unknown, fix?: T) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      remove(subscription);
      if (fix) resolve(fix);
      else reject(error);
    };
    const abort = () => finish(new DeviceLocationError("unavailable", "Location request cancelled."));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(() => finish(new DeviceLocationError("timeout", "Your phone could not find your current location. Move near a window or outdoors and try again.", true)), timeoutMs);
    const onFix = (fix: T) => {
      const { latitude, longitude } = fix.coords;
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return;
      // The separate cache path labels older fixes explicitly.
      if (!Number.isFinite(fix.timestamp) || fix.timestamp < now - 60_000) return;
      finish(undefined, fix);
    };
    try {
      void subscribe(onFix, (error) => finish(error)).then((result) => {
        if (settled) remove(result);
        else subscription = result;
      }).catch((error) => finish(error));
    } catch (error) {
      finish(error);
    }
  });
}
