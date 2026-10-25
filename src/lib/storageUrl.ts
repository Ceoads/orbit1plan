/** Signed storage URLs need refreshing only near expiry, not at every page visit. */
export function isStorageUrlFresh(url: string, now = Date.now()): boolean {
  try {
    const token = new URL(url).searchParams.get('token');
    if (!token) return false;
    const payload = token.split('.')[1];
    if (!payload) return false;
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.exp === 'number' && claims.exp * 1000 > now + 60000;
  } catch { return false; }
}