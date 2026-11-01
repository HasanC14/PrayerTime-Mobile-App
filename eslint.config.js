const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ["dist*/**", "coverage/**", "android/**", "ios/**", "review/**", "announcement-video/**", "google-play-assets/**", "modules/**/build/**"]
  }
]);
