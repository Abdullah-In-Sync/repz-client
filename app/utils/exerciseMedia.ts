/** Bust browser cache when gif_url host is local but file bytes were replaced. */
export function exerciseGifSrc(
  gifUrl: string | null | undefined,
  updatedAt?: string | null,
  externalId?: string | null,
): string | null {
  let url = gifUrl?.trim() || null
  if (!url && externalId) {
    url = `/exercise-gifs/${encodeURIComponent(externalId)}.gif`
  }
  if (!url) return null
  if (!updatedAt) return url
  const v = new Date(updatedAt).getTime()
  if (!Number.isFinite(v)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${v}`
}

export function hasExerciseGif(
  gifUrl: string | null | undefined,
  externalId?: string | null,
): boolean {
  return !!(gifUrl?.trim() || externalId)
}
