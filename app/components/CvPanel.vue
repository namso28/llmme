<script setup lang="ts">
import type { ProfileDoc } from '#shared/types'

const props = defineProps<{
  doc: 'cv' | 'zeugnis'
  introHtml: string
  cvHtml: string
  zeugnis?: ProfileDoc
}>()

defineEmits<{ close: []; print: []; 'update:doc': [value: 'cv' | 'zeugnis'] }>()

/* Ohne hinterlegtes Zeugnis gibt es nichts umzuschalten — dann bleibt das Panel
   das, was es vorher war: der Lebenslauf. */
const showsZeugnis = computed(() => props.doc === 'zeugnis' && Boolean(props.zeugnis))
const title = computed(() => (showsZeugnis.value ? 'Arbeitszeugnis' : 'Lebenslauf'))
</script>

<template>
  <aside class="panel" :aria-label="title">
    <div class="panel__head">
      <h2 class="panel__title">{{ title }}</h2>
      <div class="panel__tools">
        <button type="button" class="icon-btn" aria-label="Dokument drucken" title="Drucken" @click="$emit('print')">
          <AppIcon name="print" :size="16" />
        </button>
        <button type="button" class="icon-btn" aria-label="Schließen" title="Schließen" @click="$emit('close')">
          <AppIcon name="close" :size="16" />
        </button>
      </div>
    </div>

    <div v-if="zeugnis" class="panel__tabs">
      <button
        type="button"
        class="tab"
        :class="{ 'tab--on': doc === 'cv' }"
        @click="$emit('update:doc', 'cv')"
      >
        Lebenslauf
      </button>
      <button
        type="button"
        class="tab"
        :class="{ 'tab--on': doc === 'zeugnis' }"
        @click="$emit('update:doc', 'zeugnis')"
      >
        Arbeitszeugnis
      </button>
    </div>

    <div class="panel__body">
      <template v-if="showsZeugnis">
        <p class="panel__origin">{{ zeugnis!.label }}</p>

        <!-- Das eingescannte Original ist das, was ein Recruiter am Ende sehen
             will — deshalb steht es als eigene Schaltfläche über dem Text und
             nicht als Verweis daneben. -->
        <a
          v-if="zeugnis!.pdf"
          class="btn btn--on panel__download"
          :href="zeugnis!.pdf"
          download
        >
          <AppIcon name="download" :size="16" />
          <span>Original als PDF herunterladen</span>
        </a>
        <!-- eslint-disable-next-line vue/no-v-html -- Quelle sind ausschließlich eigene content/-Dateien -->
        <div class="prose" v-html="zeugnis!.html" />
      </template>
      <template v-else>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose" v-html="introHtml" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose" v-html="cvHtml" />
      </template>
    </div>
  </aside>
</template>
