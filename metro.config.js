const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit workers to avoid Node 24 worker thread memory exhaustion on Windows
config.maxWorkers = 2;

module.exports = config;
