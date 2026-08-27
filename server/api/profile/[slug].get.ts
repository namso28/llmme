import { readDoc, readProfileMeta, renderMarkdown } from '~~/server/utils/content'
import type { ProfilePayload } from '#shared/types'

export default defineEventHandler(async (event): Promise<ProfilePayload> => {
  const slug = getRouterParam(event, 'slug') ?? ''

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültiger Slug' })
  }

  const profile = await readProfileMeta(slug)
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profil nicht gefunden' })
  }

  const [cv, zeugnis] = await Promise.all([
    readDoc(slug, 'cv.md'),
    readDoc(slug, 'zeugnis.md'),
  ])

  const label = typeof zeugnis?.meta?.quelle === 'string' ? zeugnis.meta.quelle.trim() : ''

  return {
    slug,
    meta: profile.meta,
    introHtml: renderMarkdown(profile.intro),
    // Feedback und FAQ werden bewusst nicht ausgeliefert — sie fließen nur in
    // den System-Prompt ein und gehören nicht auf die öffentliche Seite.
    cvHtml: renderMarkdown(cv?.body ?? '_Noch kein Lebenslauf hinterlegt._'),
    // Das Zeugnis dagegen schon: es ist im Panel aufschlagbar. Sein Frontmatter
    // (Unterzeichner, Quellenbezeichnung) bleibt dabei außen vor, gray-matter
    // trennt es ab — ausgeliefert wird nur der Fließtext.
    ...(zeugnis?.body ? { zeugnis: { label: label || 'Arbeitszeugnis', html: renderMarkdown(zeugnis.body) } } : {}),
  }
})
