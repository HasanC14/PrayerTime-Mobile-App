const { withAppBuildGradle, withGradleProperties } = require("expo/config-plugins");

function setReleaseOptimizationProperties(properties) {
  const names = ["android.enableMinifyInReleaseBuilds", "android.enableShrinkResourcesInReleaseBuilds"];
  return [
    ...properties.filter(item => item.type !== "property" || !names.includes(item.key)),
    ...names.map(key => ({ type: "property", key, value: "true" }))
  ];
}

function useOptimizedProguardPreset(contents) {
  const preset = /getDefaultProguardFile\((["'])proguard-android(?:-optimize)?\.txt\1\)/g;
  if (!preset.test(contents)) {
    throw new Error("Android release optimization: expected the Expo ProGuard preset in app/build.gradle. Review this plugin after changing the native template.");
  }
  return contents.replace(preset, "getDefaultProguardFile('proguard-android-optimize.txt')");
}

// Expo SDK 57 defaults to an unoptimized preset with release minification off.
// Keep this in prebuild configuration so both EAS preview and production release
// builds use R8; debug builds and library-provided keep rules stay unchanged.
function withAndroidReleaseOptimization(config) {
  config = withGradleProperties(config, mod => {
    mod.modResults = setReleaseOptimizationProperties(mod.modResults);
    return mod;
  });
  return withAppBuildGradle(config, mod => {
    if (mod.modResults.language !== "groovy") {
      throw new Error("Android release optimization expects Expo's Groovy build.gradle template.");
    }
    mod.modResults.contents = useOptimizedProguardPreset(mod.modResults.contents);
    return mod;
  });
}
module.exports = withAndroidReleaseOptimization;
module.exports.setReleaseOptimizationProperties = setReleaseOptimizationProperties;
module.exports.useOptimizedProguardPreset = useOptimizedProguardPreset;
