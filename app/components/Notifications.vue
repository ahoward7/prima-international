<template>
  <div class="absolute top-4 right-4 space-y-2">
    <Notification
      v-for="notification in notifications"
      :key="notification.id"
      :type="notification.type"
      :message="notification.message"
    />
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '~~/stores/notification'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)
</script>
