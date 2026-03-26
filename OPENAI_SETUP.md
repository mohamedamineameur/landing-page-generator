# Configuration OpenAI

Variables attendues:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

La route `POST /api/generate-page`:

- utilise `OPENAI_API_KEY` cote serveur
- genere la page
- genere une image marketing avec `gpt-image-1`
- sauvegarde l'image dans `public/generated`
- injecte son chemin dans la section prevue de la page
- sauvegarde ensuite la nouvelle version dans le projet courant
