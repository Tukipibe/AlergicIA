import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alergicia.app',
  appName: 'AlergicIA',
  webDir: 'www',
  android: {
    // Solo para probar contra un servidor http en tu red local: CAP_ALLOW_HTTP=1 npx cap sync android
    allowMixedContent: process.env.CAP_ALLOW_HTTP === '1',
  },
};

export default config;
