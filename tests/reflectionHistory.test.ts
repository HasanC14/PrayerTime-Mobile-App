import assert from "node:assert/strict";
import test from "node:test";
import { PRAYER_REFLECTIONS } from "../src/content/prayerReflections";
import { chooseReflection, createReflectionRepository, REFLECTION_HISTORY_KEY, validateReflectionHistory, type ReflectionSelection } from "../src/services/reflectionHistory";

const week = (offset: number) => new Date(Date.UTC(2026, 0, 5 + 7 * offset, 12)).toISOString().slice(0, 10);
const selection = (offset = 0): ReflectionSelection => ({week: week(offset), theme: "maintaining", allExempt: false});
function storage() {
  let value: string | null = null;
  const adapter = {
    getItem: async (key: string) => {assert.equal(key, REFLECTION_HISTORY_KEY); return value;},
    setItem: async (key: string, next: string) => {assert.equal(key, REFLECTION_HISTORY_KEY); value = next;}
  };
  return {adapter, value: () => value, set: (next: unknown) => {value = JSON.stringify(next);}};
}

test("a week stays pinned through reloads, different themes, language changes, and backfilled prayers", async () => {
  const h = storage();
  const first = await createReflectionRepository(h.adapter).resolve(selection());
  assert.equal(first.saved, true);
  const reopened = createReflectionRepository(h.adapter);
  const next = await reopened.resolve({...selection(), theme: "consistency", focusPrayer: "Fajr"});
  assert.equal(first.reflection.id, next.reflection.id);
  assert.equal(JSON.parse(h.value()!).seen.length, 1);
});

test("the full collection is exhausted before repeating and a new cycle avoids an immediate repeat", async () => {
  const h = storage();
  const seen = new Set<string>();
  let previous = "";
  for (let offset = 0; offset < 54; offset++) {
    // A fresh repository each week also verifies persistence across app restarts.
    const chosen = await createReflectionRepository(h.adapter).resolve(selection(offset));
    assert.equal(seen.has(chosen.reflection.id), false, chosen.reflection.id);
    seen.add(chosen.reflection.id);
    previous = chosen.reflection.id;
  }
  assert.equal(seen.size, 54);
  const recycled = await createReflectionRepository(h.adapter).resolve(selection(54));
  assert.notEqual(recycled.reflection.id, previous);
  // Revisiting an old week does not choose another lesson or reset the new cycle.
  const firstId = JSON.parse(h.value()!).weeks[week(0)];
  assert.equal((await createReflectionRepository(h.adapter).resolve(selection(0))).reflection.id, firstId);
});

test("concurrent requests serialize without losing weekly choices or returning repeats", async () => {
  const h = storage();
  const repository = createReflectionRepository(h.adapter);
  const results = await Promise.all(Array.from({length: 20}, (_, offset) => repository.resolve(selection(offset))));
  assert.equal(new Set(results.map(result => result.reflection.id)).size, 20);
  const saved = JSON.parse(h.value()!);
  assert.equal(saved.seen.length, 20);
  assert.equal(Object.keys(saved.weeks).length, 20);
});

test("exempt and sparse weeks use an appropriate pool even if a warning was previously pinned", () => {
  const warning = PRAYER_REFLECTIONS.find(item => item.tone === "warning")!;
  const initial = validateReflectionHistory({version: 1, seen: [warning.id], weeks: {[week(0)]: warning.id}, lastId: warning.id});
  for (const allExempt of [true, false]) {
    let history = initial;
    const pool = PRAYER_REFLECTIONS.filter(item => allExempt ? item.exemptionSafe : item.tone !== "warning");
    const seen = new Set();
    for (let offset = 0; offset < pool.length; offset++) {
      const chosen = chooseReflection({...selection(offset), theme: "returning", allExempt}, history);
      assert.notEqual(chosen.reflection.tone, "warning");
      if (allExempt) assert.equal(chosen.reflection.exemptionSafe, true);
      assert.equal(seen.has(chosen.reflection.id), false);
      seen.add(chosen.reflection.id);
      history = chosen.history;
    }
    assert.equal(seen.size, pool.length);
  }
});

test("a meaningful Fajr logging gap favours preparation without claiming a missed prayer", () => {
  const chosen = chooseReflection({...selection(), theme: "consistency", focusPrayer: "Fajr"}, validateReflectionHistory(null));
  assert.equal(chosen.reflection.id, "prepare-fajr");
  assert.equal(chooseReflection({...selection(1), theme: "consistency", focusPrayer: "Fajr"}, chosen.history).reflection.id === "prepare-fajr", false);
});

test("failed writes retain the session choice and later persistence recovers it", async () => {
  const h = storage();
  const save = h.adapter.setItem;
  h.adapter.setItem = async () => {throw new Error("Storage full");};
  const repository = createReflectionRepository(h.adapter);
  const a = await repository.resolve(selection());
  assert.equal(a.saved, false);
  const b = await repository.resolve({...selection(), theme: "consistency"});
  assert.equal(a.reflection.id, b.reflection.id);
  h.adapter.setItem = save;
  assert.equal((await repository.resolve(selection())).saved, true);
  assert.equal((await createReflectionRepository(h.adapter).resolve(selection())).reflection.id, a.reflection.id);
});

test("failed reads do not overwrite history and recovery preserves already recorded weeks", async () => {
  const h = storage();
  const older = await createReflectionRepository(h.adapter).resolve(selection());
  const get = h.adapter.getItem;
  const before = h.value();
  h.adapter.getItem = async () => {throw new Error("Temporarily unreadable");};
  const repository = createReflectionRepository(h.adapter);
  const offline = await repository.resolve(selection(1));
  assert.equal(offline.saved, false);
  assert.equal(h.value(), before);
  h.adapter.getItem = get;
  await repository.resolve(selection(2));
  const restored = JSON.parse(h.value()!);
  assert.equal(restored.weeks[week(0)], older.reflection.id);
  assert.equal(restored.weeks[week(1)], offline.reflection.id);
});

test("a failed save at cycle rollover does not restore exhausted IDs from disk", async () => {
  const h = storage();
  const repository = createReflectionRepository(h.adapter);
  for (let offset = 0; offset < 54; offset++) await repository.resolve(selection(offset));
  h.adapter.setItem = async () => {throw new Error("Storage full");};
  const seen = new Set();
  for (let offset = 54; offset < 108; offset++) {
    const chosen = await repository.resolve(selection(offset));
    assert.equal(chosen.saved, false);
    assert.equal(seen.has(chosen.reflection.id), false, chosen.reflection.id);
    seen.add(chosen.reflection.id);
  }
  assert.equal(seen.size, 54);
});

test("invalid history is repaired with known IDs and bounded weekly storage", () => {
  const id = PRAYER_REFLECTIONS[0].id;
  const weeks = Object.fromEntries(Array.from({length: 200}, (_, offset) => [week(offset), id]));
  const validated = validateReflectionHistory({version: 1, weeks: {...weeks, nonsense: "fake"}, seen: [id, id, "fake", null], lastId: "fake"});
  assert.equal(Object.keys(validated.weeks).length, 156);
  assert.deepEqual(validated.seen, [id]);
  assert.equal(validated.lastId, null);
  assert.deepEqual(validateReflectionHistory({version: 99}), validateReflectionHistory(null));
});
