/** Bust browser cache when gif_url host is local but file bytes were replaced. */
export function exerciseGifSrc(
  gifUrl: string | null | undefined,
  updatedAt?: string | null,
): string | null {
  if (!gifUrl) return null
  if (!updatedAt) return gifUrl
  const v = new Date(updatedAt).getTime()
  if (!Number.isFinite(v)) return gifUrl
  const sep = gifUrl.includes('?') ? '&' : '?'
  return `${gifUrl}${sep}v=${v}`
}
