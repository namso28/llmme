<script setup lang="ts">
/**
 * Die Icons des Designs an einer Stelle. Alle auf demselben 24er-Raster, alle
 * mit Strichstärke 1.5 — außer den Marken-Logos, die flächig sind.
 */
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 17 })

const filled = new Set(['linkedin', 'sparkle'])
const isFilled = computed(() => filled.has(props.name))

const paths: Record<string, string> = {
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  pin: '<path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/>',
  phone: '<path d="M6.4 3.5h3.1l1.5 3.9-2 1.5a12.5 12.5 0 0 0 6.1 6.1l1.5-2 3.9 1.5v3.1a2 2 0 0 1-2.2 2A17.3 17.3 0 0 1 4.4 5.7a2 2 0 0 1 2-2.2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 5.5 8.5-5.5"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="m9 13.6-1 7.4 4-2.2 4 2.2-1-7.4"/>',
  download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/>',
  print: '<path d="M6.5 9V3.5h11V9"/><rect x="3" y="9" width="18" height="7" rx="2"/><path d="M6.5 14h11v6.5h-11z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  send: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2"/>',
  ask: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3zM9.5 9.5h3.8v1.5h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.75v5.7h-4v-5.05c0-1.2-.02-2.75-1.75-2.75s-2.02 1.31-2.02 2.66v5.14h-4z"/>',
  sparkle: '<path d="M12 3.2 13.9 8.6 19.3 10.5 13.9 12.4 12 17.8 10.1 12.4 4.7 10.5 10.1 8.6z"/>',
}

const path = computed(() => paths[props.name] ?? paths.doc!)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="isFilled ? 'currentColor' : 'none'"
    :stroke="isFilled ? 'none' : 'currentColor'"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="path"
  />
</template>
