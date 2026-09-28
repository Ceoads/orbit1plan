import { LegalLayout, LegalSection, LegalList } from "@/components/LegalLayout";

const PrivacyPage = () => (
  <LegalLayout
    title="Politique de confidentialité"
    subtitle="Comment Orbit collecte, utilise et protège tes données."
  >
    <p className="text-[15px] leading-relaxed text-muted-foreground">
      Dernière mise à jour : septembre 2026. Orbit est un assistant d'études qui t'aide à organiser
      tes cours, tes documents et tes révisions. Cette page explique, en toute transparence,
      quelles données nous collectons et comment nous les protégeons.
    </p>

    <LegalSection title="Les données que nous collectons">
      <LegalList
        items={[
          "Ton compte : adresse e-mail, mot de passe (chiffré, jamais lisible par nous) et ton nom d'affichage, ainsi que ta photo de profil si tu en ajoutes une.",
          "Ton emploi du temps : lorsque tu connectes un calendrier universitaire (iCal), nous récupérons les cours qu'il contient.",
          "Tes documents : les fichiers que tu importes dans le Vault (notes, PDF, images) et les textes extraits pour la recherche.",
          "Tes données de révision : tâches, quiz, fiches et scores générés à partir de tes documents.",
          "Connexion Google Drive (facultative) : uniquement si tu la choisis, un accès limité aux fichiers du dossier que tu sélectionnes.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Comment nous utilisons tes données">
      <LegalList
        items={[
          "Organiser ton emploi du temps et t'envoyer des rappels utiles.",
          "Classer automatiquement tes documents par matière et te permettre de les retrouver.",
          "Générer des quiz, des fiches et des résumés à partir de tes propres documents.",
          "Améliorer la fiabilité et la sécurité du service.",
        ]}
      />
      <p>Nous ne vendons jamais tes données et ne les utilisons pas à des fins publicitaires.</p>
    </LegalSection>

    <LegalSection title="Intelligence artificielle">
      <p>
        Les fonctions intelligentes d'Orbit (quiz, fiches, lecture de documents) s'appuient sur
        l'IA de Google (Gemini). Le contenu de tes documents est transmis à ce service uniquement
        pour générer ce que tu demandes, et n'est pas utilisé pour entraîner des modèles publics.
      </p>
    </LegalSection>

    <LegalSection title="Où sont hébergées tes données">
      <p>
        Tes données sont stockées de manière sécurisée dans une base de données et un stockage de
        fichiers hébergés en Europe. L'accès à tes données personnelles est protégé par des règles
        strictes : personne d'autre que toi ne peut les lire.
      </p>
    </LegalSection>

    <LegalSection title="Durée de conservation et suppression">
      <LegalList
        items={[
          "Tes données sont conservées tant que ton compte existe.",
          "Tu peux supprimer un document à tout moment depuis le Vault : il disparaît définitivement.",
          "Tu peux demander la suppression complète de ton compte et de toutes tes données en nous écrivant à contact@orbit-plan.com.",
        ]}
      />
    </LegalSection>

    <LegalSection title="Tes droits (RGPD)">
      <p>
        Tu disposes d'un droit d'accès, de rectification, d'effacement, de portabilité et
        d'opposition concernant tes données. Pour exercer ces droits, écris-nous à
        contact@orbit-plan.com : nous répondons sous 30 jours.
      </p>
    </LegalSection>

    <LegalSection title="Cookies et stockage local">
      <p>
        Orbit utilise uniquement le stockage local de ton navigateur pour te garder connecté(e) et
        mémoriser tes préférences (mode de vue, historique de recherche). Aucun cookie publicitaire
        ou traceur tiers n'est déposé.
      </p>
    </LegalSection>
  </LegalLayout>
);

export default PrivacyPage;
