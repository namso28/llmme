import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-08-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  // Markdown content is bundled as a Nitro server asset. This works identically
  // on `nuxt dev`, `node .output/server`, and Vercel — no filesystem access at
  // runtime, no database, no build step of our own.
  nitro: {
    serverAssets: [
      {
        baseName: 'content',
        dir: fileURLToPath(new URL('./content', import.meta.url)),
      },
    ],
  },

  runtimeConfig: {
    // 'ollama' (local, default) | 'anthropic' (hosted, for Vercel)
    llmProvider: process.env.LLM_PROVIDER || 'ollama',

    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-5',

    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap',
        },
      ],
    },
  },
})
