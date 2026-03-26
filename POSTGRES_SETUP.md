# Configuration PostgreSQL avec Sequelize

Le projet expose maintenant un client serveur dans `lib/sequelize.ts`.

Variables supportees :

```bash
# JWT simple pour les tests API
JWT_SECRET=change-me

# Option 1 : URL complete
DATABASE_URL=postgres://postgres:postgres@localhost:5432/capturia

# Option 2 : variables separees
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=capturia
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Optionnel pour les bases managées
POSTGRES_SSL=false
```

Exemple d'utilisation :

```ts
import { ensureDatabaseConnection, getSequelize } from "@/lib/sequelize";

export async function GET() {
  await ensureDatabaseConnection();
  const sequelize = getSequelize();

  const [result] = await sequelize.query("SELECT NOW() AS now");

  return Response.json(result);
}
```

Notes :

- Les routes `projects` et `pages` attendent un header `Authorization: Bearer <token>`.
- Le token JWT est renvoye par `POST /api/users` et `POST /api/auth/login`.
- `DATABASE_URL` est prioritaire si elle est definie.
- L'instance Sequelize est memoisee afin de reutiliser la meme connexion dans le runtime serveur courant.
- Le module est protege par `server-only`, donc il doit rester utilise cote serveur.
