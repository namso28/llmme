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

  const cv = await readDoc(slug, 'cv.md')

  return {
    slug,
    meta: profile.meta,
    introHtml: renderMarkdown(profile.intro),
    // Feedback und FAQ werden bewusst nicht ausgeliefert — sie fließen nur in
    // den System-Prompt ein und gehören nicht auf die öffentliche Seite.
    cvHtml: renderMarkdown(cv?.body ?? '_Noch kein Lebenslauf hinterlegt._'),
  }
})
