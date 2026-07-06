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
    cleartext: false
  }
}

export default config
