# Démo mobile : ajouter les nouvelles fonctionnalités

On garde tel quel tout ce qui existe déjà dans la démo (cadre iPhone, notification de cours, Pocket Space, fiche cours, notification IA + flashcard, écran final « Commencer »). On ajoute simplement de nouvelles scènes, dans le même style, entre la flashcard et l'écran final.

## Les scènes actuelles (rien ne change)
1. Notification de cours (0–3 s)
2. Pocket Space (3–5 s)
3. Fiche cours (5–9 s)
4. Notification IA + flashcard (9–13 s)

## Nouvelles scènes ajoutées
5. **Google Drive → « Par matière »** (13–17 s) : une carte « Synchroniser » importe 3 cours, puis chaque cours glisse tout seul dans sa matière avec le badge « Semestre 1 » et un petit toast « 3 cours rangés ».
6. **Orbit AI** (17–21 s) : la mascotte pêche actuelle (inchangée) répond à « Explique-moi le chapitre 2 » avec une réponse qui s'écrit progressivement et une petite onde de voix.
7. **Mode Concentration** (21–25 s) : la même mascotte avec les yeux rouges lumineux, un parcours Section → Unité → Mastery Check avec une barre de progression qui avance.
8. **Quiz & Fiches** (25–28 s) : une question de quiz, une réponse choisie, coche verte et score qui monte.
9. Écran final « Commencer » (28 s), identique.

Durée totale : environ 14 s → 28 s. Le bouton « Rejouer » relance tout depuis le début.

## Détails techniques
- Fichier unique : `src/components/demo/DemoTheatre.tsx`. Ajouter les phases E/F/G/H avec leurs constantes de temps, états booléens, `resetStates` étendu, `SHOW_CTA = 28`.
- Mêmes primitives Framer Motion, couleurs pêche/corail/crème déjà utilisées, mascotte réutilisée via le composant existant (aucun redessin).
- Contenu clairement fictif (exemples), aucun appel IA ni écriture de compte.
- Vérification à 393 px de large via Playwright (captures à chaque scène).
