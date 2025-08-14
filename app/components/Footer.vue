<template>
  <div class="text-prima-red text-center p-8">
    <div class="w-full border-t-2 border-prima-red" />
    <div class="flex flex-col items-center gap-4 py-8">
      <div class="font-extrabold">
        Prima International Trading &copy; 2025
      </div>
      <div class="flex items-center gap-2">
        <Button class="!h-8 !px-3" :disabled="syncing" @click="onSync">
          {{ syncing ? 'Syncing…' : 'Sync Now' }}
        </Button>
        <span v-if="lastResult?.ok" class="text-green-700 text-sm">
          Synced (M: {{ lastResult.counts?.machines ?? 0 }}, A: {{ lastResult.counts?.archives ?? 0 }}, S: {{ lastResult.counts?.sold ?? 0 }}, C: {{ lastResult.counts?.contacts ?? 0 }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMachineStore } from '~~/stores/machine'
import { useNotificationStore } from '~~/stores/notification'
import { useManualSync } from '~/composables/useManualSync'

const { syncing, lastResult, syncNow } = useManualSync()
const notify = useNotificationStore()
const machineStore = useMachineStore()

async function onSync() {
  const res = await syncNow()
  if (res?.ok) {
    notify.pushNotification('success', 'Sync complete')
    machineStore.refreshMachines++
  }
  else {
    notify.pushNotification('error', res?.error || 'Sync failed')
  }
}
</script>
