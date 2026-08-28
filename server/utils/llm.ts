import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from '#shared/types'

export interface StreamOptions {
  system: string
  messages: ChatMessage[]
  signal?: AbortSignal
}

/**
 * Eine Schnittstelle, zwei Adapter. Umschalten per LLM_PROVIDER — der Rest der
 * App weiß nicht, welches Modell antwortet.
 */
export interface LLMProvider {
  readonly id: string
  streamChat(options: StreamOptions): AsyncIterable<string>
}

/** Lokal: Ollama, nativer /api/chat-Endpunkt (NDJSON-Stream). Kein API-Key. */
function createOllamaProvider(baseUrl: string, model: string): LLMProvider {
  return {
    id: `ollama:${model}`,
    async *streamChat({ system, messages, signal }) {
      const url = `${baseUrl.replace(/\/$/, '')}/api/chat`
      let response: Response

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal,
          body: JSON.stringify({
            model,
            stream: true,
            options: { temperature: 0.3 },
            messages: [{ role: 'system', content: system }, ...messages],
          }),
        })
      } catch (cause) {
        if (signal?.aborted) throw cause
        // Ohne diesen Zweig sieht der Nutzer nur "fetch failed".
        throw new Error(`Ollama ist unter ${url} nicht erreichbar. Läuft "ollama serve"?`, { cause })
      }

      if (!response.ok || !response.body) {
        const detail = response.status === 404
          ? `Modell "${model}" nicht gefunden — mit "ollama pull ${model}" laden.`
          : await response.text().catch(() => '')
        throw new Error(`Ollama antwortete mit ${response.status}. ${detail}`.trim())
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // NDJSON: eine vollständige JSON-Zeile pro Chunk-Grenze, nicht pro read().
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          const chunk = JSON.parse(line) as { message?: { content?: string }; done?: boolean }
          const text = chunk.message?.content
          if (text) yield text
        }
      }
    },
  }
}

/**
 * Modelle, die output_config.effort NICHT kennen und eine Anfrage damit mit 400
 * abweisen. Alles ab der 4.6-Generation unterstützt es, die 4.5er-Reihe nicht.
 */
const OHNE_EFFORT = [/^claude-haiku-4-5/, /^claude-sonnet-4-5/]

/** Produktion: Anthropic Messages API über das offizielle SDK. */
function createAnthropicProvider(apiKey: string, model: string): LLMProvider {
  const client = new Anthropic({ apiKey })
  const kenntEffort = !OHNE_EFFORT.some(muster => muster.test(model))

  return {
    id: `anthropic:${model}`,
    async *streamChat({ system, messages, signal }) {
      const stream = client.messages.stream(
        {
          model,
          max_tokens: 2048,
          // Der System-Prompt ist über alle Anfragen hinweg byte-identisch und
          // trägt den kompletten Lebenslauf — der ideale Cache-Präfix.
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          // Kurze Antworten auf einem kleinen Kontext brauchen keine tiefe
          // Deliberation. Wo effort greift, bleibt Thinking an, nur flacher;
          // auf Haiku 4.5 denkt das Modell ohne thinking-Parameter ohnehin nicht.
          ...(kenntEffort ? { output_config: { effort: 'low' as const } } : {}),
          messages,
        },
        { signal },
      )

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text
        }
      }
    },
  }
}

/**
 * Nuxt backt runtimeConfig-Defaults beim Build ein; zur Laufzeit greifen sonst
 * nur NUXT_-präfixierte Variablen. Deshalb hat die echte Umgebungsvariable
 * Vorrang — sonst ändert eine Anpassung im Vercel-Dashboard ohne Redeploy nichts.
 */
function setting(envName: string, fallback: string): string {
  return process.env[envName] || fallback
}

export function getLLMProvider(): LLMProvider {
  const config = useRuntimeConfig()
  const provider = setting('LLM_PROVIDER', config.llmProvider)

  if (provider === 'anthropic') {
    const apiKey = setting('ANTHROPIC_API_KEY', config.anthropicApiKey)
    if (!apiKey) {
      throw new Error('LLM_PROVIDER=anthropic, aber ANTHROPIC_API_KEY ist nicht gesetzt.')
    }
    return createAnthropicProvider(apiKey, setting('ANTHROPIC_MODEL', config.anthropicModel))
  }

  if (provider === 'ollama') {
    return createOllamaProvider(
      setting('OLLAMA_BASE_URL', config.ollamaBaseUrl),
      setting('OLLAMA_MODEL', config.ollamaModel),
    )
  }

  throw new Error(`Unbekannter LLM_PROVIDER: "${provider}". Erlaubt: "ollama", "anthropic".`)
}
