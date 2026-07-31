import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.syncrasystems.society',
  appName: 'mAI Society',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  server: {
    url: 'https://maisociety.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['maisociety.vercel.app', 'syncra-society.vercel.app', '*.vercel.app']
  }
}

export default config
