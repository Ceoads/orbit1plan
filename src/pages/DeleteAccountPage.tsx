import { LegalLayout, LegalSection, LegalList } from "@/components/LegalLayout";

const DeleteAccountPage = () => (
  <LegalLayout
    title="Supprimer ton compte"
    subtitle="Comment effacer définitivement ton compte Orbit et toutes tes données."
  >
    <p className="text-[15px] leading-relaxed text-muted-foreground">
      Tu peux supprimer ton compte Orbit à tout moment, gratuitement et sans condition. La
      suppression est définitive : elle efface l'intégralité de tes données de nos serveurs.
    </p>

    <LegalSection title="Ce qui sera supprimé">
      <LegalList
        items={[
          "Ton compte et ton profil (nom, photo, préférences).",
          "Ton emploi du temps et tes événements synchronisés.",
          "Tous tes documents du Vault et les fichiers associés.",
          "Tes tâches, notes, quiz, fiches, moyennes et conversations Orbit AI.",
          "Tes connexions aux services tiers (Google Drive), dont les jetons d'accès chiffrés.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Depuis l'application (recommandé)">
      <LegalList
        items={[
          "Connecte-toi à Orbit, puis ouvre Réglages (ou Profil sur téléphone).",
          "Descends jusqu'à la « Zone de danger ».",
          "Touche « Supprimer mon compte » et confirme. Tout est effacé immédiatement.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Par e-mail">
      <p>
        Si tu n'as plus accès à ton compte, écris-nous à{" "}
        <a
          href="mailto:contact@orbit-plan.com?subject=Suppression%20de%20mon%20compte%20Orbit"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          contact@orbit-plan.com
        </a>{" "}
        depuis l'adresse e-mail de ton compte. Nous traitons la demande sous 30 jours maximum, en
        général beaucoup plus vite.
      </p>
    </LegalSection>

    <LegalSection title="Après la suppression">
      <p>
        Aucune copie de tes données n'est conservée, hors obligations légales éventuelles. Les
        sauvegardes techniques résiduelles disparaissent lors de leur rotation normale. Cette
        action est irréversible : un compte supprimé ne peut pas être restauré.
      </p>
    </LegalSection>
  </LegalLayout>
);

export default DeleteAccountPage;
