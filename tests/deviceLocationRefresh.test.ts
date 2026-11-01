import assert from "node:assert/strict";
import test from "node:test";
import type { AppLocation } from "../src/types";
import { createDeviceLocationRefresh } from "../src/services/deviceLocationRefresh";
import { waitForLocationFix } from "../src/services/locationFix";

const saved: AppLocation = { name: "Dhaka, Bangladesh", lat: 23.81, lng: 90.41, timeZone: "Asia/Dhaka", source: "device", capturedAt: Date.now() - 1000 };
type Adapter = Parameters<typeof createDeviceLocationRefresh>[0];
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function setup(overrides: Partial<Adapter> = {}, timeout = 30) {
  let current: AppLocation | null = saved;
  const issues: unknown[] = [];
  const busy: [boolean, boolean][] = [];
  const progress: (string | null)[] = [];
  const applied: AppLocation[] = [];
  let accessCalls = 0;
  const adapter: Adapter = {
    ensureAccess: async () => { accessCalls++; },
    cached: async () => null,
    fresh: async () => ({ ...saved, capturedAt: saved.capturedAt + 1000 }),
    current: () => current,
    apply: async value => { applied.push(value); current = value; },
    busy: (pending, explicit) => busy.push([pending, explicit]),
    progress: value => progress.push(value),
    issue: error => issues.push(error),
    ...overrides,
  };
  return { refresh: createDeviceLocationRefresh(adapter, timeout), issues, busy, progress, applied, accessCalls: () => accessCalls, setCurrent: (value: AppLocation | null) => { current = value; } };
}

test("quiet refresh reuses an acquisition and never displays explicit progress", async () => {
  const fix = deferred<AppLocation>();
  const state = setup({ fresh: () => fix.promise }, 1000);
  const first = state.refresh.refresh(false);
  assert.equal(first, state.refresh.refresh(false));
  await tick();
  assert.equal(state.accessCalls(), 1);
  fix.resolve({ ...saved, capturedAt: saved.capturedAt + 1000 });
  assert.equal(await first, true);
  assert.deepEqual(state.busy, [[true, false], [false, false]]);
  assert.ok(state.progress.every(value => value === null));
});

test("cached coordinates apply immediately without waiting for a fresh fix or place naming", async () => {
  const fresh = deferred<AppLocation>();
  const cached = { ...saved, capturedAt: saved.capturedAt + 200, fixKind: "cached" as const };
  const state = setup({ cached: async () => cached, fresh: () => fresh.promise }, 1000);
  const task = state.refresh.refresh(false);
  await tick();
  assert.deepEqual(state.applied, [cached]);
  fresh.resolve({ ...saved, capturedAt: saved.capturedAt + 500 });
  await task;
  assert.equal(state.applied.length, 2);
});

test("quiet deadline includes a stalled permission check and ignores late results", async () => {
  const permission = deferred<void>();
  let cacheCalls = 0;
  const state = setup({ ensureAccess: () => permission.promise, cached: async () => { cacheCalls++; return saved; } });
  assert.equal(await state.refresh.refresh(false), true);
  assert.deepEqual(state.issues, []);
  assert.deepEqual(state.busy.at(-1), [false, false]);
  permission.resolve();
  await tick();
  assert.equal(cacheCalls, 0);
  assert.deepEqual(state.applied, []);
});

test("quiet deadline cancels a native watch and retains the saved position without an alert", async () => {
  let removed = 0;
  const state = setup({ fresh: (_, signal) => waitForLocationFix(async () => ({ remove: () => { removed++; } }), 5000, signal).then(() => saved) });
  await state.refresh.refresh(false);
  assert.equal(removed, 1);
  assert.deepEqual(state.issues, []);
  assert.deepEqual(state.applied, []);
});

test("native subscription arriving after timeout is still removed", async () => {
  const subscription = deferred<{ remove: () => void }>();
  let removed = 0;
  const state = setup({ fresh: (_, signal) => waitForLocationFix(() => subscription.promise, 5000, signal).then(() => saved) });
  await state.refresh.refresh(false);
  subscription.resolve({ remove: () => { removed++; } });
  await tick();
  assert.equal(removed, 1);
});

test("manual selection cancels acquisition and a late fix cannot overwrite the chosen city", async () => {
  const late = deferred<AppLocation>();
  const state = setup({ fresh: () => late.promise }, 1000);
  const task = state.refresh.refresh(false);
  await tick();
  state.refresh.cancel();
  state.setCurrent({ ...saved, name: "Sylhet", source: "manual" });
  late.resolve({ ...saved, capturedAt: saved.capturedAt + 2000 });
  assert.equal(await task, false);
  assert.deepEqual(state.applied, []);
  assert.deepEqual(state.issues, []);
  await state.refresh.refresh(false);
  assert.equal(state.accessCalls(), 1, "a quiet refresh must keep the manual city");
});

test("cancelling during cache lookup prevents both late cache application and a fresh lookup", async () => {
  const cache = deferred<AppLocation>();
  let freshCalls = 0;
  const state = setup({ cached: () => cache.promise, fresh: async () => { freshCalls++; return saved; } }, 1000);
  const task = state.refresh.refresh(false);
  await tick();
  state.refresh.cancel();
  cache.resolve({ ...saved, capturedAt: saved.capturedAt + 1000 });
  assert.equal(await task, false);
  assert.deepEqual(state.applied, []);
  assert.equal(freshCalls, 0);
});

test("explicit request supersedes a quiet request and quiet pulls reuse the explicit acquisition", async () => {
  const old = deferred<AppLocation>();
  const fresh = deferred<AppLocation>();
  let oldSignal: AbortSignal | undefined;
  const state = setup({ fresh: (explicit, signal) => { if (!explicit) oldSignal = signal; return explicit ? fresh.promise : old.promise; } }, 1000);
  const background = state.refresh.refresh(false);
  await tick();
  const explicit = state.refresh.refresh(true);
  assert.equal(oldSignal?.aborted, true);
  assert.equal(explicit, state.refresh.refresh(false));
  await tick();
  fresh.resolve({ ...saved, capturedAt: saved.capturedAt + 2000 });
  await explicit;
  old.resolve({ ...saved, capturedAt: saved.capturedAt + 1000 });
  assert.equal(await background, false);
  assert.equal(state.applied.length, 1);
  assert.equal(state.applied[0].capturedAt, saved.capturedAt + 2000);
  assert.ok(state.progress.includes("Finding your current position…"));
});

test("explicit permission errors are actionable and settle the busy state", async () => {
  const denied = new Error("Permission denied");
  const state = setup({ ensureAccess: async () => { throw denied; } });
  await state.refresh.refresh(true);
  assert.deepEqual(state.issues, [denied]);
  assert.deepEqual(state.busy, [[true, true], [false, true]]);
});

test("a failed cache still permits a fresh fix, and older fixes cannot replace newer coordinates", async () => {
  const state = setup({ cached: async () => { throw new Error("No cache"); }, fresh: async () => ({ ...saved, capturedAt: saved.capturedAt - 1000 }) });
  await state.refresh.refresh(false);
  assert.deepEqual(state.applied, []);
  assert.deepEqual(state.issues, []);
});
