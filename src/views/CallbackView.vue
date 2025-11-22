<template>
  <div>
    <h1>Callback</h1>
    <p>Processing authentication...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { handleAuthCallback } from '../lib/oidc/token'

const router = useRouter()

onMounted(async () => {
  await handleAuthCallback(window.location.href)
  await router.replace({ name: 'home' })
})
</script>
