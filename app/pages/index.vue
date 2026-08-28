<script setup lang="ts">
const { data: profiles } = await useFetch('/api/profiles')

/* Ein Profil ist der Normalfall — dann führt die Startseite direkt dorthin.
   Liegen mehrere vor, steht darunter die Auswahl. */
const lead = computed(() => profiles.value?.[0] ?? null)

useHead({ title: 'llmme — ein Lebenslauf, mit dem man reden kann' })

const scene = useTemplateRef<HTMLElement>('scene')

/* Parallaxe: Maus und Scroll schreiben nur zwei Variablen, die Ebenen im CSS
   rechnen ihre Verschiebung daraus selbst — je nach hinterlegter Tiefe. */
onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (reduced.matches) return

  let frame = 0
  let mx = 0
  let my = 0
  let sy = 0

  const apply = () => {
    frame = 0
    const el = scene.value
    if (!el) return

    el.style.setProperty('--mx', mx.toFixed(3))
    el.style.setProperty('--my', my.toFixed(3))
    el.style.setProperty('--sy', String(Math.round(sy)))
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(apply)
  }

  const onMove = (event: PointerEvent) => {
    // -1 … 1, gemessen von der Mitte des Fensters.
    mx = (event.clientX / window.innerWidth) * 2 - 1
    my = (event.clientY / window.innerHeight) * 2 - 1
    schedule()
  }

  const onScroll = () => {
    sy = window.scrollY
    schedule()
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
  })
})
</script>

<template>
  <main class="landing">
    <section ref="scene" class="hero">
      <div class="hero__glow" />

      <div class="hero__stage">
        <!-- Die Blasen liegen auf mehreren Tiefenebenen. Position, Tiefe und
             Drehung stehen im Stylesheet, damit schmale Geräte sie umstellen
             können — inline gesetzt käme keine Medienabfrage dagegen an. -->
        <div class="drift drift--b1">
          <div class="float" style="--dur: 7.5s">
            <div class="bubble3d bubble3d--ask">Wie arbeitet er im Team?</div>
          </div>
        </div>

        <div class="drift drift--b2">
          <div class="float" style="--dur: 9s; --delay: -2s">
            <div class="bubble3d">
              Führung eines 10-köpfigen Teams, Code-Reviews, Coaching.
              <span class="bubble3d__source">Quelle: Lebenslauf</span>
            </div>
          </div>
        </div>

        <div class="drift drift--b3">
          <div class="float" style="--dur: 8s; --delay: -4s">
            <div class="bubble3d bubble3d--ask">Welche Technologien?</div>
          </div>
        </div>

        <div class="drift drift--b4">
          <div class="float" style="--dur: 10s; --delay: -6s">
            <div class="bubble3d">
              TypeScript, Vue, Nuxt — dazu PHP und Symfony im Backend.
              <span class="bubble3d__source">Quelle: Lebenslauf</span>
            </div>
          </div>
        </div>

        <div class="drift drift--b5 drift--far">
          <div class="float" style="--dur: 11s; --delay: -3s">
            <div class="bubble3d bubble3d--ask">Was sagt das Arbeitszeugnis?</div>
          </div>
        </div>

        <div class="drift drift--portrait">
          <img
            v-if="lead?.avatar"
            class="hero__portrait"
            :src="lead.avatar"
            :alt="lead.name"
          >
        </div>
      </div>

      <div class="hero__copy">
        <h1 class="hero__title">Frag meinen Lebenslauf.</h1>
        <p class="hero__lead">
          Statt zu blättern: eine Frage stellen. Ein KI-Assistent antwortet aus meinem
          Lebenslauf und Arbeitszeugnis — und nennt zu jeder Antwort die Quelle.
        </p>
        <NuxtLink v-if="lead" class="cta" :to="`/${lead.slug}`">
          <span>Chat starten</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
        </NuxtLink>
      </div>
    </section>

    <section class="steps">
      <ol class="steps__list">
        <li class="step">
          <span class="step__no">01</span>
          <p class="step__text">Frag, was du wissen willst — frei formuliert.</p>
        </li>
        <li class="step">
          <span class="step__no">02</span>
          <p class="step__text">Die Antwort kommt in Sekunden, mit Quellenangabe.</p>
        </li>
        <li class="step">
          <span class="step__no">03</span>
          <p class="step__text">Lebenslauf und Zeugnis bleiben im Original einsehbar.</p>
        </li>
      </ol>

      <ul v-if="profiles && profiles.length > 1" class="profile-list">
        <li v-for="profile in profiles" :key="profile.slug">
          <NuxtLink class="profile-list__item" :to="`/${profile.slug}`">
            <span class="profile-list__name">{{ profile.name }}</span>
            <span v-if="profile.headline" class="profile-list__headline">{{ profile.headline }}</span>
          </NuxtLink>
        </li>
      </ul>

      <p v-else-if="!profiles?.length" class="empty">
        Noch kein Profil angelegt. Lege einen Ordner unter <code>content/&lt;slug&gt;/</code> an.
      </p>
    </section>
  </main>
</template>
