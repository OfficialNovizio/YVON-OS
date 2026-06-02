/**
 * lib/ventures.ts — Shared venture registry helpers.
 *
 * Single source of truth for per-venture tech-stack metadata.
 * Import from here instead of duplicating the constant in every route file.
 */

export const VENTURE_TECH_STACK: Record<string, string> = {
  'hourbour':       'Flutter mobile app (Dart, Firebase)',
  'novizio':        'Next.js e-commerce web app (TypeScript, Supabase)',
  'yvon-dashboard': 'Next.js AI operating system (TypeScript, Supabase)',
}

export function getVentureTechStack(ventureSlug: string | undefined): string {
  return VENTURE_TECH_STACK[ventureSlug ?? ''] ?? 'web/mobile app'
}

export function isFlutterVenture(ventureSlug: string | undefined, githubSnapshot?: string, message?: string): boolean {
  const stack = getVentureTechStack(ventureSlug)
  return stack.includes('Flutter') ||
    (!!githubSnapshot && /pubspec\.yaml/i.test(githubSnapshot)) ||
    (!!message && /\b(flutter|\.dart)\b/i.test(message))
}
