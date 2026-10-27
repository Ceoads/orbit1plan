// Google service-account access (Orbit Hub sync bot). Credentials never leave the server.
type SA = { client_email: string; private_key: string; token_uri?: string };
let cached: { token: string; exp: number } | null = null;

export function serviceAccount(): SA | null {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    return sa.client_email && sa.private_key ? sa : null;
  } catch { return null; }
}

const b64url = (data: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
};

async function signingKey(pem: string) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\\n|\s/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

export async function serviceAccountToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const sa = serviceAccount();
  if (!sa) throw new Error("Bot de synchronisation non configuré");
  const now = Math.floor(Date.now() / 1000);
  const aud = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/drive.readonly", aud, iat: now, exp: now + 3600,
  }))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await signingKey(sa.private_key), new TextEncoder().encode(unsigned));
  const res = await fetch(aud, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  if (!res.ok) { console.error("sa token", res.status, await res.text()); throw new Error("Bot de synchronisation indisponible"); }
  const d = await res.json();
  cached = { token: d.access_token, exp: Date.now() + Number(d.expires_in ?? 3600) * 1000 };
  return cached.token;
}

export const serviceAccountDrive = (path: string) =>
  serviceAccountToken().then((t) => fetch(`https://www.googleapis.com${path}`, { headers: { Authorization: `Bearer ${t}` } }));
