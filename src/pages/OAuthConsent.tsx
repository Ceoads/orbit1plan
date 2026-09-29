import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type OAuthResult = { data: any; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Demande d'autorisation invalide.");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("Aucune redirection reçue."); }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "Une application";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-foreground">Autorisation impossible</h1>
            <p className="text-muted-foreground">{error}</p>
          </>
        ) : !details ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">Connecter {clientName} à Orbit</h1>
            <p className="text-muted-foreground">
              {clientName} pourra consulter ton emploi du temps et gérer tes tâches en ton nom.
            </p>
            <div className="flex flex-col gap-3">
              <Button className="h-12 rounded-2xl" disabled={busy} onClick={() => decide(true)}>Autoriser</Button>
              <Button variant="ghost" className="h-12 rounded-2xl" disabled={busy} onClick={() => decide(false)}>Refuser</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
