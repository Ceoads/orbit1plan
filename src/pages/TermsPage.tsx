import { LegalLayout, LegalSection, LegalList } from "@/components/LegalLayout";

const TermsPage = () => (
  <LegalLayout
    title="Conditions d'utilisation"
    subtitle="Les règles qui encadrent l'utilisation d'Orbit."
  >
    <p className="text-[15px] leading-relaxed text-muted-foreground">
      Dernière mise à jour : septembre 2026. En créant un compte ou en utilisant Orbit, tu acceptes
      ces conditions. Elles ont été rédigées pour être claires et courtes.
    </p>

    <LegalSection title="Le service">
      <p>
        Orbit est un assistant d'études qui organise ton emploi du temps, tes documents et tes
        révisions, et génère du contenu d'apprentissage (quiz, fiches, résumés) à partir de tes
        propres documents. Le service est accessible sur orbit-plan.com.
      </p>
    </LegalSection>

    <LegalSection title="Ton compte">
      <LegalList
        items={[
          "Tu dois fournir une adresse e-mail valide et garder ton mot de passe confidentiel.",
          "Tu es responsable de l'activité qui se produit sur ton compte.",
          "Un seul compte par personne ; les comptes partagés ne sont pas autorisés.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Ce que tu importes">
      <LegalList
        items={[
          "Tu conserves la propriété de tous les documents que tu importes dans Orbit.",
          "Tu confirmes avoir le droit d'utiliser les documents que tu importes (tes notes de cours, par exemple).",
          "Il est interdit d'importer du contenu illégal, nuisible ou portant atteinte aux droits d'autrui.",
          "Les contenus générés par l'IA (quiz, fiches, résumés) sont des aides à la révision et peuvent contenir des erreurs : vérifie toujours les informations importantes.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Utilisation acceptable">
      <LegalList
        items={[
          "N'utilise pas Orbit pour contourner des évaluations ou enfreindre le règlement de ton établissement.",
          "N'essaie pas d'accéder aux données d'autres utilisateurs ni de perturber le service.",
          "N'utilise pas de robots ou de scripts pour solliciter le service de manière abusive.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Disponibilité et évolutions">
      <p>
        Orbit évolue en continu : certaines fonctions peuvent être ajoutées, modifiées ou
        interrompues. Nous faisons notre possible pour assurer un service fiable, sans garantir une
        disponibilité ininterrompue.
      </p>
    </LegalSection>

    <LegalSection title="Résiliation">
      <p>
        Tu peux arrêter d'utiliser Orbit et demander la suppression de ton compte à tout moment en
        écrivant à contact@orbit-plan.com. Nous pouvons suspendre un compte en cas de violation de
        ces conditions, après t'en avoir informé(e) lorsque c'est possible.
      </p>
    </LegalSection>

    <LegalSection title="Responsabilité">
      <p>
        Orbit est fourni « en l'état » comme aide à l'organisation et à la révision. Nous ne
        saurions être tenus responsables des conséquences académiques ou personnelles liées à
        l'utilisation du service ou des contenus générés par l'IA.
      </p>
    </LegalSection>

    <LegalSection title="Modifications des conditions">
      <p>
        Ces conditions peuvent évoluer. En cas de changement important, nous t'en informerons par
        e-mail ou dans l'application avant qu'il ne prenne effet. En continuant à utiliser Orbit
        après, tu acceptes la version à jour.
      </p>
    </LegalSection>
  </LegalLayout>
);

export default TermsPage;
