import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_TASBEEH, MAX_TASBEEH_COUNT, TASBEEH_PRESETS, tasbeehReducer, validateTasbeehState } from "../src/services/tasbeeh";

const custom = { id: "custom-evening", name: "Evening dhikr", target: 5 };

test("Tasbeeh restores valid counts and repairs unknown selection and malformed custom entries", () => {
  const restored = validateTasbeehState({ selectedId: "missing", custom: [null, custom, custom, { id: "general", name: "Changed preset", target: 1 }, { id: "custom-invalid", name: " ", target: -1 }], counts: { general: 4, subhanallah: -1, alhamdulillah: 1.9, "custom-evening": 3, orphan: 20 } });
  assert.equal(restored.selectedId, "general");
  assert.deepEqual(restored.custom, [custom]);
  assert.deepEqual(restored.counts, { general: 4, alhamdulillah: 1, "custom-evening": 3 });
  assert.deepEqual(validateTasbeehState(null), EMPTY_TASBEEH);
});

test("presets retain independent counts and changing counters never resets another", () => {
  let state = tasbeehReducer(EMPTY_TASBEEH, { type: "increment" });
  state = tasbeehReducer(state, { type: "select", id: "subhanallah" });
  for (let index = 0; index < 33; index++) state = tasbeehReducer(state, { type: "increment" });
  state = tasbeehReducer(state, { type: "select", id: "general" });
  assert.equal(state.counts.general, 1);
  assert.equal(state.counts.subhanallah, 33);
  assert.equal(EMPTY_TASBEEH.counts.general, undefined);
});

test("reaching a target preserves the count and allows continued remembrance", () => {
  let state = tasbeehReducer(EMPTY_TASBEEH, { type: "add", definition: custom });
  for (let index = 0; index < 7; index++) state = tasbeehReducer(state, { type: "increment" });
  assert.equal(state.counts[custom.id], 7);
  assert.equal(state.custom[0].target, 5);
  assert.equal(state.selectedId, custom.id);
});

test("undo and reset affect only the selected counter, with no negative counts", () => {
  let state = validateTasbeehState({ counts: { general: 3, subhanallah: 20 } });
  state = tasbeehReducer(state, { type: "undo" });
  assert.equal(state.counts.general, 2);
  state = tasbeehReducer(state, { type: "reset" });
  state = tasbeehReducer(state, { type: "undo" });
  assert.equal(state.counts.general, 0);
  assert.equal(state.counts.subhanallah, 20);
});

test("deleting a selected custom counter falls back to General and removes only its saved count", () => {
  const state = validateTasbeehState({ selectedId: custom.id, custom: [custom], counts: { [custom.id]: 3, general: 12, subhanallah: 33 } });
  const next = tasbeehReducer(state, { type: "delete", id: custom.id });
  assert.equal(next.selectedId, "general");
  assert.deepEqual(next.custom, []);
  assert.deepEqual(next.counts, { general: 12, subhanallah: 33 });
  assert.equal(tasbeehReducer(next, { type: "delete", id: "general" }), next);
  assert.equal(TASBEEH_PRESETS[0].target, 100);
});

test("stored custom names, target values, ids and counts are bounded", () => {
  const state = validateTasbeehState({ selectedId: custom.id, custom: [{ ...custom, name: "a".repeat(100) }, { ...custom, id: "custom-bad", target: 1.5 }], counts: { general: Infinity, [custom.id]: Number.MAX_SAFE_INTEGER } });
  assert.equal(state.custom[0].name.length, 80);
  assert.equal(state.custom.length, 1);
  assert.equal(state.counts[custom.id], MAX_TASBEEH_COUNT);
  assert.equal(state.counts.general, undefined);
  assert.equal(tasbeehReducer(state, { type: "increment" }), state);
  assert.equal(tasbeehReducer(state, { type: "select", id: "unknown" }), state);
});

test("rapid sequential count actions and persistence round-trip retain every tap", () => {
  let state = EMPTY_TASBEEH;
  for (let index = 0; index < 200; index++) state = tasbeehReducer(state, { type: "increment" });
  assert.equal(state.counts.general, 200);
  assert.deepEqual(validateTasbeehState(JSON.parse(JSON.stringify(state))), state);
});

test("invalid or duplicate custom additions leave selection and saved counts intact", () => {
  const state = validateTasbeehState({ selectedId: "subhanallah", counts: { subhanallah: 17 }, custom: [custom] });
  assert.equal(tasbeehReducer(state, { type: "add", definition: custom }), state);
  assert.equal(tasbeehReducer(state, { type: "add", definition: { ...custom, id: "custom-invalid", target: 0 } }), state);
  assert.equal(state.selectedId, "subhanallah");
  assert.equal(state.counts.subhanallah, 17);
});

test("custom counters are bounded and adding beyond the limit retains the selected counter", () => {
  const state = validateTasbeehState({ selectedId: "custom-49", custom: Array.from({ length: 52 }, (_, index) => ({ id: `custom-${index}`, name: `Counter ${index}`, target: 100 })) });
  assert.equal(state.custom.length, 50);
  assert.equal(tasbeehReducer(state, { type: "add", definition: custom }), state);
  assert.equal(state.selectedId, "custom-49");
});
