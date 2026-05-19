import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nstournaments.app',
  appName: 'NS Tournaments',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
