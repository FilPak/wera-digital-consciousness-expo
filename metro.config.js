const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Dodaj obsługę dla wszystkich platform
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Optymalizacja dla Android z obsługą reanimated
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Dodaj obsługę dla reanimated
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

module.exports = config; 