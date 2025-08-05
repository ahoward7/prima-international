// stores/notificationStore.ts
import { defineStore } from 'pinia'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: number
  type: NotificationType
  message: string
}

let idCounter = 0

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[]
  }),

  actions: {
    pushNotification(type: NotificationType, message: string, durationInSeconds: number = 5) {
      const id = idCounter++
      const notification: Notification = { id, type, message }
      this.notifications.push(notification)

      setTimeout(() => {
        this.removeNotification(id)
      }, durationInSeconds * 1000)
    },

    removeNotification(id: number) {
      this.notifications = this.notifications.filter((n) => n.id !== id)
    },

    clearAll() {
      this.notifications = []
    }
  }
})
