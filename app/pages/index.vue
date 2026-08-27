<script setup lang="ts">
const { data: profiles } = await useFetch('/api/profiles')
useHead({ title: 'llmme' })
</script>

<template>
  <main class="page page--narrow">
    <header class="masthead">
      <h1 class="masthead__title">llmme</h1>
      <p class="masthead__subtitle">Ein Lebenslauf, mit dem man reden kann.</p>
    </header>

    <ul v-if="profiles?.length" class="profile-list">
      <li v-for="profile in profiles" :key="profile.slug">
        <NuxtLink class="profile-list__item" :to="`/${profile.slug}`">
          <span class="profile-list__name">{{ profile.name }}</span>
          <span v-if="profile.headline" class="profile-list__headline">{{ profile.headline }}</span>
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="empty">
      Noch kein Profil angelegt. Lege einen Ordner unter <code>content/&lt;slug&gt;/</code> an.
    </p>
  </main>
</template>
