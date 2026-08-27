<script setup lang="ts">
import type { ProfileMeta } from '#shared/types'

const props = defineProps<{ meta: ProfileMeta; openDoc: 'cv' | 'zeugnis' | null; hasZeugnis: boolean }>()

defineEmits<{ open: [doc: 'cv' | 'zeugnis'] }>()

const initials = computed(() => initialsOf(props.meta.name))

/* Lädt das Porträt nicht, bleiben die Initialen — besser als ein kaputtes Bild. */
const avatarBroken = ref(false)
const showAvatar = computed(() => Boolean(props.meta.avatar) && !avatarBroken.value)

/** GitHub und LinkedIn bekommen ihr Logo, alles andere ein generisches Symbol. */
function iconFor(label: string): string {
  const key = label.toLowerCase()
  if (key.includes('github')) return 'github'
  if (key.includes('linkedin')) return 'linkedin'
  return 'link'
}
</script>

<template>
  <aside class="rail">
    <div class="rail__id">
      <div class="rail__photo">
        <img
          v-if="showAvatar"
          class="avatar__img"
          :src="meta.avatar"
          :alt="meta.name"
          @error="avatarBroken = true"
        >
        <span v-else class="rail__monogram" aria-hidden="true">{{ initials }}</span>
      </div>

      <div class="rail__names">
        <p v-if="meta.headline" class="rail__role">{{ meta.headline }}</p>
        <h1 class="rail__name">{{ meta.name }}</h1>
        <p v-if="meta.location" class="rail__meta">
          <AppIcon name="pin" :size="14" />
          <span>{{ meta.location }}</span>
        </p>
      </div>
    </div>

    <button
      type="button"
      class="btn rail__toggle"
      :class="{ 'btn--on': openDoc !== null }"
      @click="$emit('open', 'cv')"
    >
      <AppIcon name="doc" :size="16" />
      <span>Unterlagen</span>
    </button>

    <div v-if="meta.links?.length || meta.email" class="rail__social">
      <a
        v-for="link in meta.links ?? []"
        :key="link.url"
        class="social"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="link.label"
        :aria-label="link.label"
      >
        <AppIcon :name="iconFor(link.label)" :size="16" />
      </a>
      <a
        v-if="meta.email"
        class="social"
        :href="`mailto:${meta.email}`"
        title="E-Mail"
        aria-label="E-Mail schreiben"
      >
        <AppIcon name="mail" :size="16" />
      </a>
    </div>

    <div class="rail__spacer" />

    <!-- Die beiden Unterlagen, die es zu sehen gibt. Gedruckt wird aus dem
         Panel heraus, Kontakt läuft über das Mail-Symbol darüber. -->
    <div class="rail__actions">
      <button
        type="button"
        class="btn"
        :class="{ 'btn--on': openDoc === 'cv' }"
        @click="$emit('open', 'cv')"
      >
        <AppIcon name="doc" :size="16" />
        <span>Lebenslauf</span>
      </button>
      <button
        v-if="hasZeugnis"
        type="button"
        class="btn"
        :class="{ 'btn--on': openDoc === 'zeugnis' }"
        @click="$emit('open', 'zeugnis')"
      >
        <AppIcon name="award" :size="16" />
        <span>Zeugnis</span>
      </button>
    </div>
  </aside>
</template>
