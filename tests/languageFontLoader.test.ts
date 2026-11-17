import assert from "node:assert/strict";
import test from "node:test";
import { createLanguageFontLoader } from "../src/services/languageFontLoader";

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {resolve = done;});
  return {promise, resolve};
};

test("English never waits for an unused language's slow font load", async () => {
  const slow = deferred();
  const calls: string[] = [];
  const fonts = createLanguageFontLoader(async language => {calls.push(language); await slow.promise;});
  const background = fonts.load("bn");
  await fonts.load("en");
  assert.equal(fonts.ready("en"), true);
  assert.equal(fonts.ready("bn"), false);
  assert.deepEqual(calls, ["bn"]);
  slow.resolve();
  await background;
});

test("a selected language waits for registration and shares the pending request", async () => {
  const registration = deferred();
  let calls = 0;
  const fonts = createLanguageFontLoader(async () => {calls++; await registration.promise;});
  const first = fonts.load("ar");
  assert.equal(fonts.load("ar"), first);
  assert.equal(fonts.ready("ar"), false);
  registration.resolve();
  await first;
  await fonts.load("ar");
  assert.equal(fonts.ready("ar"), true);
  assert.equal(calls, 1);
});

test("Arabic becomes ready while unrelated Bangla registration is still pending", async () => {
  const bangla = deferred();
  const fonts = createLanguageFontLoader(language => language === "bn" ? bangla.promise : Promise.resolve());
  const background = fonts.load("bn");
  await fonts.load("ar");
  assert.equal(fonts.ready("ar"), true);
  assert.equal(fonts.ready("bn"), false);
  bangla.resolve();
  await background;
});

test("a failed font permits fallback, leaves other languages untouched, and can retry", async () => {
  let calls = 0;
  const fonts = createLanguageFontLoader(async () => {if (++calls === 1) throw new Error("Local font unavailable");});
  await assert.rejects(fonts.load("bn"));
  assert.equal(fonts.ready("bn"), true);
  assert.equal(fonts.ready("ar"), false);
  await fonts.load("bn");
  assert.equal(calls, 2);
});
