import type { AppLocation } from "../types";
import { DeviceLocationError } from "./locationErrors";

interface LocationRefreshAdapter {
  ensureAccess: (explicit: boolean) => Promise<void>;
  cached: () => Promise<AppLocation | null>;
  fresh: (explicit: boolean, signal: AbortSignal) => Promise<AppLocation>;
  current: () => AppLocation | null;
  apply: (location: AppLocation, explicit: boolean) => Promise<void>;
  busy: (pending: boolean, explicit: boolean) => void;
  progress: (message: string | null) => void;
  issue: (error: unknown) => void;
}

// Even a native permission/cache promise that never settles must not hold a
// quiet request open. Native watches receive the same signal for cleanup.
function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DeviceLocationError("timeout", "Your phone could not find your current location. Please try again.", true));
    if (signal.aborted) { void operation.catch(() => undefined); abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
    operation.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export function createDeviceLocationRefresh(adapter: LocationRefreshAdapter, quietTimeoutMs = 10_000) {
  type Request = { explicit: boolean; controller: AbortController; promise: Promise<boolean> };
  let pending: Request | null = null;

  const cancel = () => {
    const request = pending;
    pending = null;
    if (request) {
      request.controller.abort();
      adapter.busy(false, request.explicit);
      adapter.progress(null);
    }
  };

  async function run(request: Request): Promise<boolean> {
    const { explicit, controller } = request;
    const active = () => pending === request;
    const usable = () => active() && !controller.signal.aborted;
    const timer = explicit ? undefined : setTimeout(() => controller.abort(), quietTimeoutMs);
    adapter.busy(true, explicit);
    if (explicit) adapter.progress("Checking location permission and phone settings…");
    try {
      await abortable(adapter.ensureAccess(explicit), controller.signal);
      if (!usable()) return false;
      if (explicit) adapter.progress("Finding your current position…");
      try {
        const cached = await abortable(adapter.cached(), controller.signal);
        if (!usable()) return false;
        const current = adapter.current();
        if (cached && (current?.source !== "device" || cached.capturedAt >= current.capturedAt)) {
          await adapter.apply(cached, explicit);
          if (explicit && usable()) adapter.progress("Updating your location…");
        }
      } catch {
        // An empty or failed cache does not prevent a fresh position request.
      }
      if (!usable()) return active() && Boolean(adapter.current());
      const fresh = await abortable(adapter.fresh(explicit, controller.signal), controller.signal);
      if (!usable()) return false;
      const current = adapter.current();
      if (current?.source !== "device" || fresh.capturedAt >= current.capturedAt) await adapter.apply(fresh, explicit);
      return true;
    } catch (error) {
      // Quiet failures retain the saved position without repeated home warnings.
      if (active() && (explicit || !adapter.current())) adapter.issue(error);
      return active() && !explicit && Boolean(adapter.current());
    } finally {
      if (timer) clearTimeout(timer);
      if (active()) {
        pending = null;
        adapter.busy(false, explicit);
        adapter.progress(null);
      }
    }
  }

  return {
    refresh(explicit: boolean): Promise<boolean> {
      if (pending && (!explicit || pending.explicit)) return pending.promise;
      if (!explicit && adapter.current()?.source === "manual") return Promise.resolve(true);
      cancel(); // An explicit request may replace a quiet one.
      const request: Request = { explicit, controller: new AbortController(), promise: Promise.resolve(false) };
      pending = request;
      request.promise = run(request);
      return request.promise;
    },
    cancel,
  };
}
