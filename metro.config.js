const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  watchFolders: [path.resolve(__dirname, '../src')],
  resolver: {
    extraNodeModules: {
      'react-native-audio-waveform-kit': path.resolve(__dirname, '../src'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
