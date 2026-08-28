import { listSlugs, readProfileMeta } from '~~/server/utils/content'

export default defineEventHandler(async () => {
  const slugs = await listSlugs()
  const profiles = await Promise.all(
    slugs.map(async (slug) => {
      const profile = await readProfileMeta(slug)
      if (!profile) return null
      return {
        slug,
        name: profile.meta.name,
        headline: profile.meta.headline ?? '',
        // Die Startseite zeigt das Porträt groß und freigestellt.
        avatar: profile.meta.avatarCutout ?? profile.meta.avatar ?? '',
      }
    }),
  )
  return profiles.filter(p => p !== null)
})
