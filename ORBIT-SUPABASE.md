# Brancher l'app sur le projet Supabase « orbit »

Après l'export du code vers GitHub, crée un fichier `.env` à la racine
(en local ou chez ton hébergeur) avec ces trois valeurs :

```
VITE_SUPABASE_PROJECT_ID="dlzwkjjeqilzhhbjrkfq"
VITE_SUPABASE_URL="https://dlzwkjjeqilzhhbjrkfq.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsendramplcWlsemhoYmpya2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDY0NTEsImV4cCI6MjEwNTM4MjQ1MX0.V8V4rquWDkbkmL4WaWc3kN0pjlPcKO_g3Jqyo_MYbaU"
```

Ces valeurs sont publiques (clé « anon »), elles peuvent figurer dans le dépôt.

Puis : `bun install` puis `bun run dev` (ou `bun run build` pour déployer).

Tant que l'app tourne dans Lovable, elle reste branchée sur la base Lovable :
le fichier `src/integrations/supabase/client.ts` est généré automatiquement
et n'est pas modifiable ici.
