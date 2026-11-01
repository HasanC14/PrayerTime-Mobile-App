const { withDangerousMod } = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");

// Package the same originals used by the app. Android widgets can read these
// locally even when the React Native process has never started after a reboot.
module.exports = function withWidgetArtwork(config) {
  return withDangerousMod(config, ["android", async mod => {
    const destination = path.join(mod.modRequest.platformProjectRoot, "app/src/main/assets/prayertime-widgets");
    await fs.mkdir(destination, { recursive: true });
    for (const file of ["prayer-hero-mosque.png", "prayer-hero-skyline.png", "prayer-hero-moonlit.png"]) {
      await fs.copyFile(path.join(mod.modRequest.projectRoot, "assets/illustrations", file), path.join(destination, file));
    }
    return mod;
  }]);
};
