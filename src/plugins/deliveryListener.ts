import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

export type DeliveryConsent = 'unknown' | 'granted' | 'denied'

export type DeliveryListenerStatus = {
  platform: string
  consent: DeliveryConsent | string
  enabled: boolean
  smsPermission: 'granted' | 'denied' | string
  notificationListenerEnabled: boolean
  postNotifications: 'granted' | 'denied' | string
}

export type DeliveryDetectedEvent = {
  id: string
  source: 'sms' | 'notification' | string
  sender?: string
  packageName?: string
  body: string
  providerHint?: string
  capturedAt?: number
}

export interface DeliveryListenerPlugin {
  getStatus(): Promise<DeliveryListenerStatus>
  setConsent(options: { consent: 'granted' | 'denied' }): Promise<{ consent: string }>
  startListening(): Promise<{ enabled: boolean }>
  stopListening(): Promise<{ enabled: boolean }>
  requestSmsPermissions(): Promise<{ smsPermission: string }>
  requestPostNotifications(): Promise<{ postNotifications: string }>
  openNotificationListenerSettings(): Promise<void>
  drainPending(): Promise<{ events: DeliveryDetectedEvent[] }>
  showPreApprovalNotice(options: { provider: string; hours?: number }): Promise<void>
  addListener(
    eventName: 'deliveryDetected',
    listenerFunc: (event: DeliveryDetectedEvent) => void
  ): Promise<PluginListenerHandle>
}

class DeliveryListenerWeb implements DeliveryListenerPlugin {
  async getStatus(): Promise<DeliveryListenerStatus> {
    return {
      platform: Capacitor.getPlatform(),
      consent: 'denied',
      enabled: false,
      smsPermission: 'denied',
      notificationListenerEnabled: false,
      postNotifications: 'denied'
    }
  }
  async setConsent({ consent }: { consent: 'granted' | 'denied' }) {
    return { consent }
  }
  async startListening() {
    return { enabled: false }
  }
  async stopListening() {
    return { enabled: false }
  }
  async requestSmsPermissions() {
    return { smsPermission: 'denied' }
  }
  async requestPostNotifications() {
    return { postNotifications: 'denied' }
  }
  async openNotificationListenerSettings() {}
  async drainPending() {
    return { events: [] as DeliveryDetectedEvent[] }
  }
  async showPreApprovalNotice() {}
  async addListener(
    _eventName: 'deliveryDetected',
    _listenerFunc: (event: DeliveryDetectedEvent) => void
  ): Promise<PluginListenerHandle> {
    return { remove: async () => undefined }
  }
}

/** Native Android implementation is DeliveryListenerPlugin.java (injected at APK build). */
export const DeliveryListener = registerPlugin<DeliveryListenerPlugin>('DeliveryListener', {
  web: () => new DeliveryListenerWeb()
})

export function isDeliveryListenerAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}
