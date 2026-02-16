import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.bezkomprese.app',
  appName: 'Bez Komprese',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      providers: ["google.com"],
      skipNativeAuth: true
    }
  }
};

export default config;
