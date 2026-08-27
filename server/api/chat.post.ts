import { createEventStream } from 'h3'
import { buildSystemPrompt } from '~~/server/utils/prompt'
import { getLLMProvider } from '~~/server/utils/llm'
import { buildOutputGuard } from '~~/server/utils/guard'
import type { ChatMessage } from '#shared/types'

const MAX_TURNS = 20
const MAX_CHARS = 2000

interface ChatRequest {
  slug?: string
  messages?: ChatMessage[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)
  const slug = body?.slug ?? ''

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültiger Slug' })
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : []
  const messages: ChatMessage[] = incoming
    .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))

  if (messages.length === 0 || messages.at(-1)?.role !== 'user') {
    throw createError({ statusCode: 400, statusMessage: 'Letzte Nachricht muss vom Nutzer stammen' })
  }

  const system = await buildSystemPrompt(slug)
  if (!system) {
    throw createError({ statusCode: 404, statusMessage: 'Profil nicht gefunden' })
  }

  const provider = getLLMProvider()
  const guard = await buildOutputGuard(slug)
  const stream = createEventStream(event)
  const abort = new AbortController()
  stream.onClosed(() => abort.abort())

  // Die ersten Zeichen werden zurückgehalten, bevor sie den Client erreichen.
  // Ein Prompt-Dump beginnt sofort mit den Regeln, wird also erkannt, bevor
  // irgendetwas gerendert wird. Danach läuft der Filter weiter mit.
  const HOLD_BACK_CHARS = 240

  // Nicht awaiten: die Antwort muss zurückgehen, damit der Stream fließt.
  ;(async () => {
    let complete = ''
    let held = ''
    let releasing = false

    try {
      for await (const delta of provider.streamChat({ system, messages, signal: abort.signal })) {
        complete += delta

        const reason = guard.inspect(complete)
        if (reason) {
          console.warn(`[chat] Antwort blockiert — ${reason}`)
          await stream.push(JSON.stringify({ type: 'blocked' }))
          return
        }

        if (releasing) {
          await stream.push(JSON.stringify({ type: 'delta', text: delta }))
          continue
        }

        held += delta
        if (held.length >= HOLD_BACK_CHARS) {
          await stream.push(JSON.stringify({ type: 'delta', text: held }))
          held = ''
          releasing = true
        }
      }

      if (held) await stream.push(JSON.stringify({ type: 'delta', text: held }))
      await stream.push(JSON.stringify({ type: 'done' }))
    } catch (error) {
      if (!abort.signal.aborted) {
        // Vollständig ins Server-Log — der Client bekommt nur eine neutrale
        // Meldung. Provider-Fehler nennen sonst Abrechnungsstatus, Modellnamen
        // oder Request-IDs, und das läse ein Recruiter im Chatfenster mit.
        console.error('[chat] Stream fehlgeschlagen:', error)
        const message = import.meta.dev
          ? (error instanceof Error ? error.message : String(error))
          : 'Der Assistent ist gerade nicht erreichbar. Bitte versuche es in einem Moment noch einmal.'
        await stream.push(JSON.stringify({ type: 'error', message }))
      }
    } finally {
      await stream.close()
    }
  })()

  return stream.send()
})
