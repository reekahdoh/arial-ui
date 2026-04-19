/** Derives a stable login-name base from the email local-part (lowercase, safe chars). */
export function emailLocalPartSlug(email: string): string {
  const local = email.trim().split('@')[0] ?? 'user';
  const slug = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return slug.length > 0 ? slug : 'user';
}
