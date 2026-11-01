import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";

const { setReleaseOptimizationProperties, useOptimizedProguardPreset } = require("../plugins/withAndroidReleaseOptimization");

test("release optimization enables R8 and resource shrinking without duplicate properties", () => {
  const original = [{type: "property", key: "android.useAndroidX", value: "true"}, {type: "property", key: "android.enableMinifyInReleaseBuilds", value: "false"}];
  const result = setReleaseOptimizationProperties(original);
  assert.deepEqual(result.filter((item: {key: string}) => item.key === "android.enableMinifyInReleaseBuilds"), [{type: "property", key: "android.enableMinifyInReleaseBuilds", value: "true"}]);
  assert.ok(result.some((item: {key: string; value: string}) => item.key === "android.enableShrinkResourcesInReleaseBuilds" && item.value === "true"));
  assert.deepEqual(setReleaseOptimizationProperties(result), result);
  assert.equal(original[1].value, "false");
  assert.deepEqual(result[0], original[0]);
});

test("installed Expo Android template uses the optimized preset and retains release keep rules", () => {
  const template = execFileSync("tar", ["-xOf", "node_modules/expo/template.tgz", "package/android/app/build.gradle"], {encoding: "utf8"});
  const result = useOptimizedProguardPreset(template);
  assert.ok(result.includes("getDefaultProguardFile('proguard-android-optimize.txt')"));
  assert.ok(result.includes('"proguard-rules.pro"'));
  assert.equal(result, template.replace('getDefaultProguardFile("proguard-android.txt")', "getDefaultProguardFile('proguard-android-optimize.txt')"));
  assert.equal(useOptimizedProguardPreset(result), result);
  assert.throws(() => useOptimizedProguardPreset("unexpected template"), /expected the Expo ProGuard preset/);
});
