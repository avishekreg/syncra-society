import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.syncrasystems.society',
  appName: 'Syncra Society',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  server: {
    url: 'https://syncra-society.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['syncra-society.vercel.app', '*.vercel.app']
  }
}

export default config
