// Handoff §3.1: 아동 화면에는 광고/외부 링크 금지.
// Defensive runtime + build-time helpers.

export const FORBIDDEN_HOST_PATTERNS: RegExp[] = [
  /^https?:\/\/api\.openai\.com/i,
  /^https?:\/\/.*\.elevenlabs\.io/i,
  /^https?:\/\/.*\.supabase\.co/i,
];

export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

// Used in JSX where any user-visible link (parent screen only) must be vetted.
export function assertParentSafeUrl(href: string): string {
  if (isExternalUrl(href)) {
    throw new Error(`external link not allowed in MVP: ${href}`);
  }
  return href;
}
