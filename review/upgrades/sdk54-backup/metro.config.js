const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Watchman can fail to start on macOS when its LaunchAgent permissions are
// damaged. Metro's built-in file watcher is reliable for this small project
// and keeps the development server available to physical devices.
config.resolver.useWatchman = false;

module.exports = config;
