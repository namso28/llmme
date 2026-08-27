<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: profile, error } = await useFetch(() => `/api/profile/${slug.value}`)

if (error.value) {
  throw createError({ statusCode: error.value.statusCode ?? 500, statusMessage: 'Profil nicht gefunden', fatal: true })
}

useHead(() => ({ title: profile.value ? `${profile.value.meta.name} — llmme` : 'llmme' }))

/* Die Unterlagen liegen nicht dauerhaft neben dem Chat, sondern gehen auf, wenn
   jemand sie sehen will — über die Topbar oder die Seitenleiste. null heißt
   geschlossen, sonst steht hier das aufgeschlagene Dokument. */
const openDoc = ref<'cv' | 'zeugnis' | null>(null)

function toggle(doc: 'cv' | 'zeugnis') {
  openDoc.value = openDoc.value === doc ? null : doc
}

/* Gedruckt wird, was gerade aufgeschlagen ist. Das Stylesheet blendet dafür
   alles andere aus, deshalb muss das Panel im DOM stehen. */
function print() {
  if (!openDoc.value) openDoc.value = 'cv'
  nextTick(() => window.print())
}

onMounted(() => {
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') openDoc.value = null
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <main v-if="profile" class="app">
    <ProfileRail
      :meta="profile.meta"
      :open-doc="openDoc"
      :has-zeugnis="Boolean(profile.zeugnis)"
      @open="toggle"
    />

    <div class="stage">
      <div class="topbar">
        <span class="topbar__title">Chat mit dem Lebenslauf</span>
        <button
          type="button"
          class="btn"
          :class="openDoc ? 'btn--on' : 'btn--ghost'"
          @click="toggle('cv')"
        >
          <AppIcon name="doc" :size="16" />
          <span>{{ openDoc ? 'Unterlagen schließen' : 'Unterlagen öffnen' }}</span>
        </button>
      </div>

      <ChatPanel
        :slug="profile.slug"
        :name="profile.meta.name"
        :avatar="profile.meta.avatar"
        :suggested-questions="profile.meta.suggestedQuestions ?? []"
      />
    </div>

    <!-- Auf schmalen Geräten legt sich das Panel über den Chat, der Schleier
         schließt es per Klick daneben. -->
    <div v-if="openDoc" class="panel__scrim" @click="openDoc = null" />
    <CvPanel
      :class="{ 'panel--open': openDoc !== null }"
      :doc="openDoc ?? 'cv'"
      :intro-html="profile.introHtml"
      :cv-html="profile.cvHtml"
      :zeugnis="profile.zeugnis"
      @update:doc="openDoc = $event"
      @close="openDoc = null"
      @print="print"
    />
  </main>
</template>
