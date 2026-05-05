const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  projectRoot: __dirname,
  watchFolders: [__dirname],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    // Prevent Metro from using parent node_modules
    resolveRequest: (context, moduleName, platform) => {
      // For non-relative imports, only resolve from node_modules inside example
      if (moduleName.startsWith('.')) {
        return context.resolveRequest(context, moduleName, platform);
      }
      // Fallback to normal resolution
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);