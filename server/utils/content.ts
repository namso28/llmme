import matter from 'gray-matter'
import { marked } from 'marked'
import type { ProfileMeta } from '#shared/types'

export type ContentFile = 'profile.md' | 'cv.md' | 'feedback.md' | 'faq.md'

interface Doc {
  meta: Record<string, unknown>
  body: string
}

const store = () => useStorage('assets:content')

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) return new TextDecoder().decode(value)
  if (value == null) return ''
  return String(value)
}

/** Alle verfügbaren Slugs — ein Unterordner in content/ pro Person. */
export async function listSlugs(): Promise<string[]> {
  const keys = await store().getKeys()
  const slugs = keys
    .map(key => key.replace(/:/g, '/').split('/')[0])
    .filter((slug): slug is string => Boolean(slug))
  return [...new Set(slugs)].sort()
}

/**
 * Liest eine Markdown-Datei. Gibt null zurück, wenn sie nicht existiert.
 *
 * HTML-Kommentare sind Notizen an dich selbst. Sie werden entfernt: im Prompt
 * würde das Modell sie als Inhalt lesen, im HTML sind sie unnötiger Ballast.
 * Ein Dokument, das danach leer ist, wird von buildSystemPrompt übersprungen.
 */
export async function readDoc(slug: string, file: ContentFile): Promise<Doc | null> {
  const raw = await store().getItem(`${slug}/${file}`)
  if (raw == null) return null
  const parsed = matter(toText(raw))
  return {
    meta: parsed.data,
    body: parsed.content.replace(/<!--[\s\S]*?-->/g, '').trim(),
  }
}

export function renderMarkdown(markdown: string): string {
  // Der Inhalt stammt ausschließlich aus den eigenen content/-Dateien,
  // niemals aus Nutzereingaben — daher kein Sanitizing nötig.
  return marked.parse(markdown, { async: false }) as string
}

export async function readProfileMeta(slug: string): Promise<{ meta: ProfileMeta; intro: string } | null> {
  const doc = await readDoc(slug, 'profile.md')
  if (!doc) return null
  const meta = doc.meta as unknown as ProfileMeta
  if (!meta?.name) return null
  return { meta, intro: doc.body }
}
