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

## Dashboard operativo

La fuente principal es Azure DevOps. GitHub contiene el código y el despliegue; la lectura de issues es opcional mediante `INCLUDE_GITHUB=true`.

La vista local inicial representa el CSV `importar_45_tickets_restantes.csv` (50 filas: 45 nuevas y 5 referencias existentes). No sustituye una consulta actual de ADO: estados y fechas aparecen sin confirmar. La sincronización con PAT reemplaza este archivo con tickets reales etiquetados `dashboard-demo`. La demo independiente contiene 72 tickets ficticios, con reloj fijo, y se activa con **Explorar demo**.

La sincronización publica responsable, fechas de creación/cambio/estado/cierre, estimaciones y objetivos disponibles. `ADO_DUE_FIELD` permite elegir la fecha objetivo (por defecto `Microsoft.VSTS.Scheduling.TargetDate`). `ADO_WAITING_FIELD` permite mapear la fecha de solicitud pendiente (por defecto `Custom.WaitingSince`); requiere crear/mantener ese campo de fecha en ADO. Sin él, la espera de respuesta permanece desconocida. No se publican textos de comentarios ni correos del responsable.

### CSV adicional

`data/importar_escenarios_operativos.csv` contiene 12 tareas nuevas para el proceso Agile, con Priority, Tags y los campos estándar de estimación. Importar desde Boards → Queries → Import work items, revisar y guardar. No importar repetidamente: no incluye IDs y cada importación creará elementos nuevos. No modifica los IDs del CSV original.

Las tareas entrarán en el estado inicial definido por ADO. Después de guardar se pueden asignar responsables reales y mover estados. La importación no recrea fechas pasadas de creación, comentarios ni transiciones; para explorar históricos usa la demo. Si el proceso no admite algún campo de estimación, elimina esa columna o agrega el campo al tipo Task antes de importar.

### Validación

`npm test` verifica los casos principales de fechas ausentes, estados, vencimiento, inactividad, espera, estimación y exportación CSV. `npm run build` genera la versión de producción. Investigación, definiciones y límites: [docs/dashboard-research.md](docs/dashboard-research.md).

## Métricas FlowViz

Nueva sección de flujo con historial de revisiones, ciclo, WIP, entregas, antigüedad, bloqueos y Monte Carlo. Consulta [definiciones y límites](docs/flowviz-port.md). Atribución: FlowViz, Nicolas Brown, licencia MIT en docs/FlowViz-LICENSE.txt.
