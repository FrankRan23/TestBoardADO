# BoardADO

Dashboard React para Azure DevOps y GitHub, publicado en GitHub Pages.

## Configuración

1. En **Settings → Pages**, selecciona **GitHub Actions** como fuente.
2. En **Settings → Secrets and variables → Actions**, crea `AZURE_DEVOPS_PAT` con permiso **Work Items: Read** para la organización `franciscorangelb`.
3. Ejecuta **Actions → Sync data and deploy dashboard → Run workflow**. También se actualiza cada hora, al minuto 17 UTC.
4. Abre `https://frankran23.github.io/TestBoardADO/`.

El workflow consulta los tickets ADO con la etiqueta `dashboard-demo` y los issues/PR de GitHub, genera `dashboard.json`, compila el frontend y publica el artefacto. El PAT nunca se incluye en el sitio. **GitHub Pages y el JSON publicado son públicos**; revisa qué títulos y campos de tickets quieres exponer.

## Local

```bash
npm ci
npm run dev
```

Sin PAT se presenta un pequeño conjunto de datos de demostración. Para generar datos reales localmente, define `AZURE_DEVOPS_PAT` y ejecuta `python scripts/sync.py`; no agregues credenciales al repositorio.
