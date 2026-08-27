<script setup lang="ts">
import type { ChatMessage } from '#shared/types'

const props = defineProps<{
  slug: string
  name: string
  avatar?: string
  suggestedQuestions: string[]
}>()

/* Wie in der Seitenleiste: fehlt oder bricht das Porträt, stehen die Initialen. */
const avatarBroken = ref(false)
const showAvatar = computed(() => Boolean(props.avatar) && !avatarBroken.value)

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isStreaming = ref(false)
const errorMessage = ref('')
const scrollArea = ref<HTMLElement | null>(null)

let controller: AbortController | null = null

/**
 * Trennt eine abschließende "Quelle: …"-Zeile vom Antworttext ab, damit sie als
 * Fußnote gesetzt werden kann. Während des Streamens greift das erst, sobald die
 * Zeile vollständig ist — bis dahin bleibt sie normaler Text.
 */
function split(content: string): { body: string; source: string | null } {
  // Die Quelle steht mal am Ende, mal — bei kleineren Modellen — als erste
  // Zeile. Beide Positionen werden abgefangen, damit sie nie als Fließtext
  // durchrutscht.
  const leading = content.match(/^\s*(Quelle:\s*[^\n]+)\n+/)
  if (leading) {
    return { body: content.slice(leading[0].length).trimStart(), source: leading[1]!.trim() }
  }

  // Am Ende ohne erzwungenen Zeilenumbruch, weil die Quelle gern an den letzten
  // Satz gehängt wird. Ein Satzanfang oder Satzende muss aber davor stehen,
  // sonst zerschneidet ein beiläufiges "Die Quelle: …" mitten im Text die Antwort.
  const trailing = content.match(/(^|\n|[.!?]\s+)(Quelle:\s*[^\n]+?)\s*$/)
  if (!trailing) return { body: content, source: null }
  const sourceStart = trailing.index! + trailing[1]!.length
  return { body: content.slice(0, sourceStart).trimEnd(), source: trailing[2]!.trim() }
}

async function scrollToBottom() {
  await nextTick()
  const el = scrollArea.value
  if (el) el.scrollTop = el.scrollHeight
}

async function send(text: string) {
  const question = text.trim()
  if (!question || isStreaming.value) return

  errorMessage.value = ''
  input.value = ''
  messages.value.push({ role: 'user', content: question })
  messages.value.push({ role: 'assistant', content: '' })
  isStreaming.value = true
  await scrollToBottom()

  const reply = messages.value.at(-1)!
  controller = new AbortController()

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        slug: props.slug,
        // Der leere Platzhalter der Antwort darf nicht mitgeschickt werden.
        messages: messages.value.slice(0, -1),
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Server antwortete mit ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE: Events sind durch eine Leerzeile getrennt.
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''

      for (const block of blocks) {
        const payload = block
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())
          .join('')
        if (!payload) continue

        const chunk = JSON.parse(payload) as { type: string; text?: string; message?: string }
        if (chunk.type === 'delta' && chunk.text) {
          reply.content += chunk.text
          await scrollToBottom()
        } else if (chunk.type === 'blocked') {
          // Der Server hat die Antwort verworfen. Bereits Gestreamtes ersetzen.
          reply.content = 'Diese Frage kann ich nicht beantworten. Frag mich gern etwas zu Werdegang, Projekten oder Arbeitsweise.'
          await scrollToBottom()
          await reader.cancel()
          return
        } else if (chunk.type === 'error') {
          throw new Error(chunk.message ?? 'Unbekannter Fehler')
        }
      }
    }

    if (!reply.content) {
      throw new Error('Das Modell hat keine Antwort geliefert.')
    }
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return
    errorMessage.value = error instanceof Error ? error.message : 'Die Anfrage ist fehlgeschlagen.'
    // Leere Platzhalter-Antwort entfernen, damit keine leere Blase stehen bleibt.
    if (!reply.content) messages.value.pop()
  } finally {
    isStreaming.value = false
    controller = null
  }
}

function stop() {
  controller?.abort()
  isStreaming.value = false
}

function onSubmit(event: Event) {
  event.preventDefault()
  send(input.value)
}

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <!-- Der Bereich trägt seinen Namen nur für Screenreader: sichtbar ist keine
       Überschrift mehr, aber die Region bleibt benannt. -->
  <section class="chat" :aria-label="`Fragen zu ${name}`">
    <div
      ref="scrollArea"
      class="chat__log"
      :class="{ 'chat__log--empty': !messages.length }"
    >
      <div v-if="!messages.length" class="column welcome">
        <div class="chat__glow" />

        <div class="welcome__intro">
          <!-- Die Begrüßung ist die erste Nachricht im Verlauf, keine
               Überschrift über einer leeren Fläche — das Gespräch hat damit
               schon begonnen, wenn jemand ankommt. Sie spricht die Person
               selbst (daher ihr Monogramm), denn der Assistent gibt sich laut
               System-Prompt nie als sie aus, sondern antwortet über sie. -->
          <div class="turn--bot greeting">
            <span class="bot-mark bot-mark--person">
              <img
                v-if="showAvatar"
                class="avatar__img"
                :src="avatar"
                :alt="name"
                @error="avatarBroken = true"
              >
              <template v-else>{{ initialsOf(name) }}</template>
            </span>
            <div>
              <h2 class="welcome__title">Hallo, ich bin {{ name }}.</h2>
              <p class="welcome__lead">
                Statt meinen Lebenslauf durchzublättern, kannst du hier einfach fragen —
                zu Werdegang, Projekten, Technologien oder Arbeitsweise.
                Ein KI-Assistent antwortet an meiner Stelle, ausschließlich aus meinen
                Unterlagen, und nennt zu jeder Antwort die Quelle.
              </p>
            </div>
          </div>
        </div>

        <div v-if="suggestedQuestions.length" class="suggestions">
          <button
            v-for="question in suggestedQuestions"
            :key="question"
            type="button"
            class="suggestion"
            :disabled="isStreaming"
            @click="send(question)"
          >
            <span class="suggestion__icon"><AppIcon name="ask" :size="18" /></span>
            <span>{{ question }}</span>
          </button>
        </div>
      </div>

      <div v-else class="column thread">
        <template v-for="(message, index) in messages" :key="index">
          <div v-if="message.role === 'user'" class="turn--user">
            <div class="bubble">{{ message.content }}</div>
          </div>

          <div v-else class="turn--bot">
            <span class="bot-mark"><AppIcon name="sparkle" :size="15" /></span>
            <div class="answer">
              <template v-if="message.content">
                <span>{{ split(message.content).body }}</span>
                <span v-if="split(message.content).source" class="answer__source">
                  {{ split(message.content).source }}
                </span>
              </template>
              <span v-else class="typing" aria-label="Antwort wird geschrieben"><i /><i /><i /></span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="dock">
      <form class="column" @submit="onSubmit">
        <!-- Im Leerzustand stehen die Vorschläge als Karten mitten auf der
             Seite. Sobald das Gespräch läuft, bleiben sie als schmale Leiste
             über der Eingabe erreichbar — als Karten würden sechs Fragen den
             Verlauf dauerhaft nach oben drücken. -->
        <div v-if="messages.length && suggestedQuestions.length" class="prompts">
          <button
            v-for="question in suggestedQuestions"
            :key="question"
            type="button"
            class="prompt"
            :disabled="isStreaming"
            @click="send(question)"
          >
            {{ question }}
          </button>
        </div>

        <div class="composer">
          <input
            v-model="input"
            class="composer__field"
            type="text"
            maxlength="2000"
            placeholder="Frag nach Werdegang, Projekten, Technologien…"
            :disabled="isStreaming"
            aria-label="Deine Frage"
          >
          <button v-if="isStreaming" type="button" class="send send--stop" aria-label="Antwort stoppen" @click="stop">
            <AppIcon name="stop" :size="16" />
          </button>
          <button v-else type="submit" class="send" :disabled="!input.trim()" aria-label="Frage senden">
            <AppIcon name="send" :size="17" />
          </button>
        </div>

        <p v-if="errorMessage" class="chat__error" role="alert">{{ errorMessage }}</p>
      </form>
    </div>
  </section>
</template>
