/**
 * Navigation helpers for course-related actions.
 * Kept as pure functions so they can be unit-tested without rendering.
 *
 * Adapted for expo-router: instead of returning a URL string (as the web
 * app's react-router version does), this returns a route descriptor that
 * can be passed directly to `router.push()`.
 */

export type CourseSubject = { id: string } | null | undefined;

export interface VaultRoute {
  pathname: '/(tabs)/vault';
  params?: { subject: string };
}

/**
 * Build the route used by "Voir toutes les notes de ce cours".
 *
 * - When a subject is provided, returns a route to the Vault tab with that
 *   subject pre-selected.
 * - When no subject is linked to the course, returns a route to the Vault
 *   tab with no params (the caller may surface a toast separately).
 */
export function buildCourseVaultRoute(subject: CourseSubject): VaultRoute {
  if (subject && subject.id) {
    return { pathname: '/(tabs)/vault', params: { subject: subject.id } };
  }
  return { pathname: '/(tabs)/vault' };
}
