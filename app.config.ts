import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Romano',
  slug: 'romano-inbox',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.jtexier.romanoinbox',
    supportsTablet: false,
  },
  // Mods run in reverse order: keep the entitlement stripper BEFORE expo-notifications so it runs last.
  plugins: ['./plugins/withoutPushEntitlement', 'expo-notifications'],
  extra: {
    builtAt: Date.now(),
  },
};

export default config;
