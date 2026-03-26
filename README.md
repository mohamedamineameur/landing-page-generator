# Capturia Funnel (Supabase)

## Prerequis
- Node.js 20+
- Un projet Supabase

## Configuration Supabase
### 1) Schema + RLS
Copie/colle le fichier `supabase/schema.sql` dans le SQL editor Supabase et execute-le.

### 2) Storage
- Cree un bucket **`photos`**
- Pour une livraison rapide: mets le bucket en **Public**

### 3) OAuth (Google)
- Supabase → **Authentication → Providers → Google**: active Google et configure le client OAuth.
- Supabase → **Authentication → URL Configuration**:
  - ajoute l'URL de ton app dans **Redirect URLs** (local + prod), par exemple:
    - `http://localhost:3000/auth/callback`
    - `https://ton-domaine.tld/auth/callback`

## Variables d'environnement (Next.js)
Cree un `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # requis pour verifier la disponibilite username
OPENAI_API_KEY=... # optionnel si tu utilises /prompt
```

## Lancer le projet
```bash
npm install
npm run dev
```

## Pages utiles
- Auth: `/auth`
- Dashboard: `/dashboard`
- Sessions (securite): `/settings/security/sessions`

## Notes
- Le champ "username" est converti en email interne: `username@capturia.dev` si l'utilisateur ne saisit pas d'email.
- Les acces aux tables sont proteges via RLS Supabase.

