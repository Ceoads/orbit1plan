# Mode Concentration — bilan du premier jalon

## Réutilisé, sans remplacement
- Authentification Orbit et matières existantes.
- Navigation bureau et cinq onglets du téléphone ; entrée supplémentaire dans Examens et à côté du compagnon dans Orbit AI.
- Mascotte `OrbitCompanion`, silhouette et visage conservés. Les yeux seuls prennent une couleur rouge douce en mode Concentration.
- Voix `useOrbitVoice`, composants Button/Select/Input/Progress, SubjectIcon et styles Orbit.
- Pipeline Gemini existant `supabase/functions/_shared/ai.ts` ; aucun nouveau fournisseur.
- Chapitres `course_chapters`, textes extraits de la Bibliothèque et textes des notes. Les documents Drive déjà importés sont utilisés comme les autres documents.

## Fonctionnel et vérifié
- Introduction unique enregistrée dans les préférences du profil.
- Sélection de matières réelles, parcours généré et enregistré, leçons sourcées et questions validées.
- Parcours sinueux avec activités terminées, disponibles et sélectionnées ; sélection libre et relecture.
- Leçon → quiz → correction serveur → preuves de compréhension → génération automatique d’une explication plus simple et de trois nouvelles questions après une difficulté.
- Réponses et indices enregistrés ; pause et reprise après actualisation.
- Examen associé repris depuis le calendrier Orbit, date modifiable et durée de séance enregistrées.
- Séparation des réponses correctes et du contenu étudiant ; évaluation atomique et idempotente côté serveur.
- Suppression des nouvelles données incluse dans la suppression de compte existante.

## Tests réalisés avec salomonade2@gmail.com
- Parcours d’espagnol préparé à partir de deux documents réels, avec trois unités, six activités initiales.
- Première leçon ouverte ; trois réponses volontairement incorrectes soumises. Résultat réel : 0/3, enregistré.
- Septième activité de renforcement réellement générée, ouverte, avec explication et trois nouvelles questions.
- Réponse au renforcement enregistrée, pause, actualisation, reprise : réponse restaurée.
- Bureau 1280 × 1800 et téléphone 390 × 844 ; aucune largeur dépassant l’écran sur téléphone, sortie du mode vérifiée.
- Aucun `pageerror` pendant le cycle leçon/quiz.
- Accès direct étudiant aux clés de correction refusé ; appel direct de la fonction de score refusé ; lecture des parcours d’un autre utilisateur renvoie zéro ligne.
- Neuf tests unitaires réussis, incluant les garde-fous de maîtrise et la navigation de cours existante. Dernier contrôle du prévisualiseur : build OK.
- Le parcours et les observations de ce test restent visibles sur le compte testé ; aucune matière ni source existante n’a été effacée.

## Partiellement implémenté
- Compréhension : heuristic version 1, pas un modèle psychométrique. Poids facile/intermédiaire/difficile, pénalité d’indice et poids réduit des évaluations suivantes. Le niveau « Maîtrisé » exige aussi des preuves d’application et de rétention ; ces dernières ne sont pas encore alimentées par un cycle complet de révision.
- Répétition : prochaine date enregistrée (1 jour après difficulté, sinon 3 jours ; branche 7 jours après rétention), mais insertion automatique de nœuds de révision différée non implémentée.
- Examen : date et durée guident la préparation initiale ; un changement d’objectif ne reconstruit pas encore automatiquement le parcours existant.
- La voix existante peut lire les leçons. Micro et mains libres ne sont pas exposés dans le nouvel espace ; le chat vocal Orbit existant reste disponible.
- Carte de connaissances : sections, concepts, objectifs et références aux sources ; graphe explicite des prérequis non implémenté.
- Les questions uniques, multiples et vrai/faux utilisent le même lecteur. Le flux réel testé portait sur le quiz généré, pas chaque type séparément.

## Non implémenté dans ce jalon
- Réponses courtes avec correction subjective, exercices d’application en texte libre.
- Examens blancs chronométrés, tableau d’analyse détaillé, planification complète jusqu’à l’examen.
- Reconnaissance durable de misconceptions nommées, adaptation avancée entre sessions et tests de rétention.
- Extraction PDF/image supplémentaire : seuls les textes déjà présents dans Orbit sont analysés. Un document sans texte extrait n’est jamais présenté comme analysé.
- Lecture directe de nouveaux fichiers Drive ou modification d’événements externes : aucune nouvelle autorisation demandée ni modification externe effectuée.

## Architecture et limites
- Nouvelles tables : learning_paths, learning_concepts, learning_activities, learning_activity_keys, learning_attempts, learning_sessions, learning_rate_events.
- Tables publiques de lecture protégées par RLS utilisateur ; écritures et clés réservées au service serveur. Fonctions atomiques pour création, évaluation, introduction, session et renforcement.
- Première analyse bornée à 12 sources textuelles, 12 000 caractères par source ; trois unités demandées, six maximum acceptées. Ce parcours ne garantit pas une couverture exhaustive du programme.
- Collections bornées à 25 lignes ; pagination des très grands catalogues et longs parcours à ajouter avant extension au-delà du premier jalon.
- Les échecs de génération sont explicites ; les réponses soumises restent enregistrées si seule la préparation suivante échoue.
- Les opérations ne changent pas les documents, tâches ou événements externes.
- La génération utilise le comportement de reprise du helper Gemini existant ; son infrastructure n’a pas été migrée.
- Aucun défaut bloquant observé sur le scénario testé. Les fonctions avancées ci-dessus ne sont pas présentées comme terminées.

## Mise en ligne
Les fonctions serveur sont déployées. La présentation web modifiée reste à publier pour apparaître sur le site public.