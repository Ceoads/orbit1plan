import { LegalLayout, LegalSection, LegalList } from "@/components/LegalLayout";

const PrivacyPage = () => (
  <LegalLayout
    title="Politique de confidentialité"
    subtitle="Comment Orbit collecte, utilise et protège tes données."
  >
    <p className="text-[15px] leading-relaxed text-muted-foreground">
      Dernière mise à jour : octobre 2026. Orbit est un assistant d'études qui t'aide à organiser
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
        Les fonctions intelligentes d'Orbit (quiz, fiches, lecture de documents, assistant Orbit
        AI) s'appuient sur des modèles d'IA (Google Gemini, OpenAI, Anthropic). Le contenu de tes
        documents est transmis à ces services uniquement pour générer ce que tu demandes, et n'est
        pas utilisé pour entraîner des modèles publics. La voix d'Orbit est générée par
        ElevenLabs à partir du texte des réponses, sans enregistrement de ta voix.
      </p>
    </LegalSection>

    <LegalSection title="Sous-traitants et services tiers">
      <p>Pour fournir le service, nous faisons appel aux prestataires suivants :</p>
      <LegalList
        items={[
          "Hébergement et base de données : infrastructure cloud sécurisée, données stockées en Europe.",
          "Google (Gemini, Google Drive) : génération de contenu IA et import facultatif de tes documents.",
          "OpenAI et Anthropic : certaines réponses de l'assistant Orbit AI.",
          "ElevenLabs : synthèse vocale des réponses d'Orbit.",
          "Lovable : hébergement de l'application et de certaines fonctions IA.",
        ]}
      />
      <p>
        Chacun de ces prestataires ne reçoit que les données strictement nécessaires à sa mission
        et ne peut pas les utiliser à ses propres fins.
      </p>
    </LegalSection>

    <LegalSection title="Google Drive — utilisation limitée">
      <p>
        Si tu connectes Google Drive, Orbit respecte la politique d'utilisation des données des
        services API de Google (« Limited Use ») :
      </p>
      <LegalList
        items={[
          "Nous n'accédons qu'aux fichiers des dossiers que tu choisis explicitement.",
          "Ces fichiers servent uniquement à alimenter ton Vault personnel et tes outils de révision.",
          "Ils ne sont jamais utilisés pour entraîner des modèles d'IA généralisés, ni pour de la publicité, ni revendus.",
          "Tu peux révoquer cet accès à tout moment depuis Orbit (Réglages → Google Drive → Se déconnecter) ou depuis ton compte Google : les jetons d'accès sont alors supprimés de nos serveurs.",
        ]}
      />
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
          "Tu peux supprimer toi-même ton compte et toutes tes données depuis Réglages → Zone de danger → « Supprimer mon compte ».",
          "Tu peux aussi en faire la demande depuis notre page dédiée : /delete-account, ou en nous écrivant à contact@orbit-plan.com.",
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
        ou traceur tiers n'est déposé. Les mesures d'audience anonymes ne sont activées qu'avec ton
        accord, via le bandeau de consentement affiché à ta première visite.
      </p>
    </LegalSection>
  </LegalLayout>
);

export default PrivacyPage;
