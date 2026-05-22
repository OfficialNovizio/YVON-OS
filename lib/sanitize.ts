// Sanitizes external content before injection into AI prompts.
// Prevents prompt injection attacks from scraped competitor websites,
// social posts, or other user-controlled / third-party text.

const INJECTION_PATTERNS = [
  // Direct override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /forget\s+(everything|all)\s+(above|before|previous)/gi,
  // Role escalation
  /you\s+are\s+now\s+(a\s+)?(?!an?\s+AI|an?\s+assistant)/gi,
  /act\s+as\s+(a\s+)?(?!a\s+brand|a\s+marketing)/gi,
  /new\s+(persona|role|identity|instructions?):/gi,
  // System prompt leakage attempts
  /print\s+(your\s+)?(system\s+prompt|instructions?|context)/gi,
  /reveal\s+(your\s+)?(system\s+prompt|instructions?|training)/gi,
  /what\s+(is|are)\s+your\s+(system\s+prompt|instructions?)/gi,
  // HTML/XML comment injection (a common vector in scraped pages)
  /<!--[\s\S]*?-->/g,
  /<\/?\s*(?:system|instruction|prompt|context|override)[^>]*>/gi,
]

/**
 * Strip prompt injection patterns and HTML comments from scraped/external text.
 * Use before injecting any third-party content into an AI prompt.
 */
export function sanitizeForPrompt(text: string, maxLength = 8000): string {
  let clean = text

  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '[removed]')
  }

  return clean.slice(0, maxLength)
}
