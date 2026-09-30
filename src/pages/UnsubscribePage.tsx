import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "used" | "invalid" | "done" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    }).then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (d.valid) setState("valid");
      else if (d.reason === "already_unsubscribed") setState("used");
      else setState("invalid");
    }).catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    setState(error ? "error" : (data as any)?.success || (data as any)?.reason === "already_unsubscribed" ? "done" : "error");
  };

  const copy: Record<State, [string, string]> = {
    loading: ["Vérification…", ""],
    valid: ["Se désabonner des e-mails Orbit ?", "Tu ne recevras plus les rappels de tâches. Les e-mails de connexion continueront de fonctionner."],
    used: ["Déjà désabonné", "Cette adresse ne reçoit plus les e-mails d'Orbit."],
    invalid: ["Lien invalide", "Ce lien de désabonnement n'est pas valide ou a expiré."],
    done: ["C'est fait", "Tu ne recevras plus les e-mails d'Orbit."],
    error: ["Une erreur est survenue", "Réessaie dans un instant."],
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card rounded-3xl p-10 max-w-md w-full text-center space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-primary font-bold text-xl">Orbit</p>
        {state === "loading" ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /> : (
          <>
            <h1 className="text-2xl font-bold">{copy[state][0]}</h1>
            <p className="text-sm text-muted-foreground">{copy[state][1]}</p>
          </>
        )}
        {state === "valid" && (
          <button onClick={confirm} disabled={busy} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium disabled:opacity-60">
            {busy ? "…" : "Confirmer le désabonnement"}
          </button>
        )}
        <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground">Retour à Orbit</Link>
      </div>
    </main>
  );
}
