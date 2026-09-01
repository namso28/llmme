<script setup lang="ts">
import type { ProfileMeta } from '#shared/types'

const props = defineProps<{ meta: ProfileMeta; openDoc: 'cv' | 'zeugnis' | null; hasZeugnis: boolean }>()

defineEmits<{ open: [doc: 'cv' | 'zeugnis'] }>()

const initials = computed(() => initialsOf(props.meta.name))

/* tel: verträgt keine Leerzeichen — die Anzeige behält ihre Gliederung. */
const telHref = computed(() => (props.meta.phone ?? '').replace(/[^\d+]/g, ''))

/* Lädt das Porträt nicht, bleiben die Initialen — besser als ein kaputtes Bild. */
const avatarBroken = ref(false)
const showAvatar = computed(() => Boolean(props.meta.avatar) && !avatarBroken.value)

/* Angezeigt wird nur der sprechende Teil des Profilnamens. Die volle Adresse
   passt nicht in die 248 px schmale Spalte, und die lange Ziffernfolge, die
   LinkedIn bei Namensdopplungen anhängt, sagt niemandem etwas. */
const linkedinText = computed(() =>
  (props.meta.linkedin ?? '')
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
    .replace(/\/$/, '')
    .replace(/-\d{6,}$/, ''),
)
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
        <a v-if="meta.email" class="rail__meta rail__mail" :href="`mailto:${meta.email}`">
          <AppIcon name="mail" :size="14" />
          <span>{{ meta.email }}</span>
        </a>
        <a v-if="meta.phone" class="rail__meta rail__mail" :href="`tel:${telHref}`">
          <AppIcon name="phone" :size="14" />
          <span>{{ meta.phone }}</span>
        </a>
        <a
          v-if="meta.linkedin"
          class="rail__meta rail__mail"
          :href="meta.linkedin"
          target="_blank"
          rel="noopener noreferrer"
        >
          <AppIcon name="linkedin" :size="14" />
          <span>{{ linkedinText }}</span>
        </a>
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
