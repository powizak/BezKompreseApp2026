import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.bezkomprese.app',
  appName: 'Bez Komprese',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      providers: ["google.com"],
      skipNativeAuth: false,
      clientId: "123625634373-bag47knc8gj4gohv8n5ruc1ol1ileidm.apps.googleusercontent.com"
    }
  }
};

export default config;
