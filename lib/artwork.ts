/**
 * Canonical artwork URL revision.
 *
 * The owner replaces a cover by writing a new `cover.png` at the same path.
 * Next's image optimizer keys its cache by URL, width, quality and negotiated
 * format, not by file content, so an in-place replacement can keep serving the
 * previous WebP variant. A stable revision in the query string gives every
 * replacement a new cache identity without renaming, converting or recompressing
 * the file.
 *
 * Bump this value only when cover bytes change. It must stay in sync with the
 * `images.localPatterns.search` entry in `next.config.ts`.
 */
export const ARTWORK_REVISION = "20261128";

/** The one canonical cover URL for a project. */
export function coverSrc(slug: string): string {
  return `/work/${slug}/cover.png?v=${ARTWORK_REVISION}`;
}
