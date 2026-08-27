<script setup lang="ts">
import type { ChatMessage } from '#shared/types'

const props = defineProps<{
  slug: string
  name: string
  suggestedQuestions: string[]
}>()

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isStreaming = ref(false)
const errorMessage = ref('')
const scrollArea = ref<HTMLElement | null>(null)

let controller: AbortController | null = null

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
  <section class="chat">
    <header class="chat__header">
      <h2 class="chat__title">Fragen zu {{ name }}</h2>
      <p class="chat__hint">Antworten stammen ausschließlich aus dem hinterlegten Lebenslauf.</p>
    </header>

    <div ref="scrollArea" class="chat__log">
      <p v-if="!messages.length" class="chat__placeholder">
        Stelle eine Frage — oder wähle eine der Vorschläge unten.
      </p>

      <div
        v-for="(message, index) in messages"
        :key="index"
        class="bubble"
        :class="`bubble--${message.role}`"
      >
        <span v-if="message.content">{{ message.content }}</span>
        <span v-else class="bubble__typing" aria-label="Antwort wird geschrieben"><i /><i /><i /></span>
      </div>
    </div>

    <p v-if="errorMessage" class="chat__error" role="alert">{{ errorMessage }}</p>

    <div v-if="suggestedQuestions.length" class="chat__suggestions">
      <button
        v-for="question in suggestedQuestions"
        :key="question"
        type="button"
        class="chip"
        :disabled="isStreaming"
        @click="send(question)"
      >
        {{ question }}
      </button>
    </div>

    <form class="chat__form" @submit="onSubmit">
      <input
        v-model="input"
        class="chat__input"
        type="text"
        maxlength="2000"
        placeholder="Deine Frage…"
        :disabled="isStreaming"
        aria-label="Deine Frage"
      >
      <button v-if="isStreaming" type="button" class="btn btn--ghost" @click="stop">Stopp</button>
      <button v-else type="submit" class="btn" :disabled="!input.trim()">Senden</button>
    </form>
  </section>
</template>
