# Orbit AI connecté à tout + actions confirmées + rangement partout

## Ce que tu verras

1. **Orbit AI connaît chaque matière en entier**
  - Pour chaque matière : les documents (nom, résumé), le nombre de fiches et ce qui est déjà maîtrisé, les résultats aux quiz, la progression en Concentration, les prochains examens.
  - Les devoirs et les notes chiffrées sont affichés avec leur matière (« Devoir de Négociation », pas seulement « Devoir »).
  - S'il cite un document, il le nomme exactement. Il n'invente jamais de contenu.
2. **Orbit AI peut agir, toujours avec ta confirmation**
  - Quand tu lui demandes « range ce cours en Négociation », « crée un devoir pour vendredi », « j'ai fini le dossier marketing » ou « supprime cette fiche », il répond et affiche sous son message une petite carte : *« Ranger « Négociation S3 - BUT TC.pdf » dans Négociation ? »*, avec les boutons **Confirmer** et **Annuler**.
  - Rien ne change tant que tu n'as pas cliqué sur Confirmer. Après la confirmation, la carte affiche « Fait », avec un bouton **Annuler** quand c'est possible (rangement, devoir terminé).
  - Actions possibles : ranger un document dans une matière, créer un devoir (titre, date, matière), marquer un devoir comme terminé, supprimer un document, un devoir ou une fiche.
  - Ça marche de la même façon sur téléphone et sur ordinateur.
3. **Le rangement automatique passe sur tous les documents**
  - Le bouton « Ranger mes cours Drive » devient **« Ranger mes documents »**. Il traite tous les documents sans matière, qu'ils viennent de Drive, d'une photo ou d'un ajout manuel. « Négociation S3 - BUT TC.pdf » sera donc pris en compte.
  - Le message final reste honnête : « X documents rangés · Y à classer à la main ».
4. **Ajouter plusieurs documents d'un coup dans une matière**

- Sur ordinateur, dans chaque matière, un bouton **« Ajouter des fichiers »** à côté de « Ajouter depuis Drive » permet de choisir plusieurs fichiers à la fois. Tu peux aussi les glisser-déposer directement.
- Chaque fichier est rangé dans cette matière, avec le bon semestre selon sa date. Son texte est extrait pour Orbit AI, les quiz et les fiches.
- Une barre de progression affiche « 3/7 ajoutés ». Un fichier qui échoue est signalé sans bloquer les autres.

## Sur téléphone, l'ajout de plusieurs fichiers existe déjà : il sera aussi rangé avec le bon semestre.

## Détails techniques

- **Contexte (orbit-ai)** : nouvelles lectures bornées et parallèles : vault_files (id, nom, subject_id, ai_summary tronqué, 80 max), flashcards (compte et mastered par matière), learning_paths/learning_concepts (mastery moyenne par parcours), calendar_events en mode examen avec exam_date à venir, tasks avec id et subject_id. Le contexte est groupé par matière, avec des identifiants courts que le modèle peut citer. Le budget total du contexte est plafonné (~12 000 caractères).
- **Actions** : le prompt système décrit un bloc final ````orbit-action {json}```` (une action max par réponse). Le client OrbitAI.tsx retire ce bloc du texte affiché et rend une carte de confirmation. Au clic sur Confirmer : `orbit-ai { action: "execute", op }`, validé par Zod côté serveur (`file_document`, `create_task`, `complete_task`, `delete_item` pour document/tâche/fiche). Chaque écriture vérifie user_id = utilisateur JWT, et chaque id est vérifié comme appartenant à l'utilisateur. Le serveur renvoie de quoi annuler (`undo`). Le bloc est aussi retiré à la relecture de l'historique, et les cartes déjà traitées ne se rejouent pas (le statut est conservé en mémoire de session et la réponse est idempotente).
- **Caches** : après exécution, invalidation des requêtes vault, tasks et flashcards pour que toutes les pages se mettent à jour sans rechargement.
- **Rangement global** : `autoFile` accepte `{ all: true }`, qui retire le filtre sur l'étiquette drive. Le reste ne change pas (curseur, lots de 25, filingOutcome). SortDriveCoursesButton passe `all: true` et change de libellé.
- **Ajout multiple desktop** : nouveau composant léger réutilisant la logique d'upload existante du Vault (storage notes + insert vault_files avec subject_id et semester_id calculé, puis extraction texte existante). Concurrence 3. Tests Vitest pour le parsing du bloc orbit-action et la validation des actions (une règle par test).
- Aucune nouvelle table ; RLS existante conservée. 
  &nbsp;

## Backend

- Et tout ca est bien rangé dans le backend  pour garder un context constant est retivable rapidemnt est l'ia orbit s'zutop améliore de plus en plus avec le temps.  avec un classezmnt propre  bien rangé est compréhnsible pour un humain de comprendre 