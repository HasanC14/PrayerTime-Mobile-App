const { withFinalizedMod } = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");

// Widget JS explicitly orders columns from the app's saved language. Give that
// coordinate system a stable base so an RTL phone doesn't mirror it a second time.
// Keep this after expo-widgets, which generates these extension entry views.
module.exports = function withWidgetLayoutDirection(config) {
  return withFinalizedMod(config, ["ios", async mod => {
    const folder = path.join(mod.modRequest.platformProjectRoot, "ExpoWidgetsTarget");
    const entry = "WidgetsEntryView(entry: entry)";
    const direction = ".environment(\\.layoutDirection, .leftToRight)";
    let found = 0;
    for (const file of await fs.readdir(folder)) {
      if (!file.endsWith(".swift")) continue;
      const filename = path.join(folder, file);
      const source = await fs.readFile(filename, "utf8");
      if (!source.includes(entry)) continue;
      found++;
      if (!source.includes(direction)) {
        await fs.writeFile(filename, source.replaceAll(entry, `${entry}\n        ${direction}`));
      }
    }
    if (!found) throw new Error("Widget layout direction: generated entry views were not found. Check the expo-widgets template.");
    return mod;
  }]);
};
