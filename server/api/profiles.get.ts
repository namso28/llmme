import { listSlugs, readProfileMeta } from '~~/server/utils/content'

export default defineEventHandler(async () => {
  const slugs = await listSlugs()
  const profiles = await Promise.all(
    slugs.map(async (slug) => {
      const profile = await readProfileMeta(slug)
      return profile ? { slug, name: profile.meta.name, headline: profile.meta.headline ?? '' } : null
    }),
  )
  return profiles.filter(p => p !== null)
})
