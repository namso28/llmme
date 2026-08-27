<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: profile, error } = await useFetch(() => `/api/profile/${slug.value}`)

if (error.value) {
  throw createError({ statusCode: error.value.statusCode ?? 500, statusMessage: 'Profil nicht gefunden', fatal: true })
}

useHead(() => ({ title: profile.value ? `${profile.value.meta.name} — llmme` : 'llmme' }))
</script>

<template>
  <main v-if="profile" class="page profile">
    <header class="profile__header">
      <div>
        <h1 class="profile__name">{{ profile.meta.name }}</h1>
        <p v-if="profile.meta.headline" class="profile__headline">{{ profile.meta.headline }}</p>
      </div>

      <dl class="profile__facts">
        <div v-if="profile.meta.location">
          <dt>Standort</dt>
          <dd>{{ profile.meta.location }}</dd>
        </div>
        <div v-if="profile.meta.email">
          <dt>E-Mail</dt>
          <dd><a :href="`mailto:${profile.meta.email}`">{{ profile.meta.email }}</a></dd>
        </div>
        <div v-for="link in profile.meta.links ?? []" :key="link.url">
          <dt>{{ link.label }}</dt>
          <dd><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.url.replace(/^https?:\/\//, '') }}</a></dd>
        </div>
      </dl>
    </header>

    <div class="profile__body">
      <aside class="profile__chat">
        <ChatPanel
          :slug="profile.slug"
          :name="profile.meta.name"
          :suggested-questions="profile.meta.suggestedQuestions ?? []"
        />
      </aside>

      <article class="cv">
        <!-- eslint-disable-next-line vue/no-v-html -- Quelle sind ausschließlich eigene content/-Dateien -->
        <div class="prose" v-html="profile.introHtml" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose" v-html="profile.cvHtml" />
      </article>
    </div>
  </main>
</template>
