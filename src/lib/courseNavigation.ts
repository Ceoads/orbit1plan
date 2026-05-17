/**
 * Navigation helpers for course-related actions.
 * Kept as pure functions so they can be unit-tested without rendering.
 */

export type CourseSubject = { id: string } | null | undefined;

/**
 * Build the path used by "Voir toutes les notes de ce cours".
 *
 * - When a subject is provided, returns `/?tab=vault&subject=<id>` so the
 *   Vault tab opens with that subject pre-selected.
 * - When no subject is linked to the course, returns `/?tab=vault` so the
 *   Vault still opens (the caller may surface a toast separately).
 */
export function buildCourseVaultPath(subject: CourseSubject): string {
  if (subject && subject.id) {
    return `/?tab=vault&subject=${subject.id}`;
  }
  return "/?tab=vault";
}
