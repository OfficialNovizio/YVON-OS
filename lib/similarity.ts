/**
 * Jaccard similarity between two strings.
 * Normalizes (lowercase, strip punctuation/emojis), tokenizes into words,
 * returns |intersection| / |union|.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a)
  const tokensB = tokenize(b)

  if (tokensA.size === 0 && tokensB.size === 0) return 0

  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)))
  const union = new Set([...tokensA, ...tokensB])

  return intersection.size / union.size
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
}
