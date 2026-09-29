import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function GoogleDriveReturn() {
  const [message, setMessage] = useState("Connexion à Google Drive…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed", reason?: string) => {
      window.opener?.postMessage({ type, connectorId: "google_drive", reason }, window.location.origin);
    };
    if (params.get("success") !== "true") {
      const code = params.get("error") ?? "rejected_request";
      const description = params.get("error_description");
      const reason = description
        ? decodeURIComponent(description.replace(/\+/g, " "))
        : code === "rejected_request"
          ? "Google a refusé la demande. Vérifie que ton compte est autorisé comme utilisateur test, puis réessaie."
          : "La connexion Google Drive n'a pas abouti.";
      console.error("Google Drive OAuth rejected", { code, description });
      setMessage(reason);
      notify("appUserConnectorOAuthFailed", reason);
      return;
    }
    const code = params.get("code");
    if (!code) {
      const reason = params.get("offline_access_allowed") === "false"
        ? "L'accès hors ligne doit être activé sur le client Google dans les réglages de l'espace de travail."
        : "Connexion terminée sans code.";
      setMessage(reason);
      notify("appUserConnectorOAuthFailed", reason);
      return;
    }
    supabase.functions.invoke("google-drive", { body: { action: "complete", code } }).then(({ error }) => {
      if (error) {
        const reason = "Impossible de finaliser la connexion Google Drive. Réessaie depuis Orbit.";
        console.error("Google Drive OAuth exchange failed", error);
        setMessage(reason);
        notify("appUserConnectorOAuthFailed", reason);
      } else {
        notify("appUserConnectorOAuthComplete");
        window.close();
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-10">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
