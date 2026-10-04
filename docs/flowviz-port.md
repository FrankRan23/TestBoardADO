# Adaptación de FlowViz

Se revisaron README, las herramientas MCP y DataModelSchema de FlowViz (Project).pbit (UTF-16LE). Implementación web independiente: React/Recharts calcula sobre JSON generado por Actions; no necesita Power BI ni autenticación en el navegador.

Incluye percentiles interpolados P50/P85/P95, dispersión de ciclo, entregas diarias, WIP diario, flujo acumulado, flujo neto, antigüedad contra P85, bloqueos, tiempo por columna y pronóstico de fecha Monte Carlo.

La sincronización obtiene todas las revisiones paginadas de cada ticket seleccionado por dashboard-demo. Publica únicamente fecha, estado, columna, columna terminada y bloqueo, además de los campos existentes. El PAT sigue en Actions. Fallos al leer historial hacen fallar el workflow para evitar publicar resultados parciales como completos.

Estados estándar: New/Proposed/To Do pendientes; Active/Committed/In Progress/Resolved en progreso; Closed/Done completados; Removed excluido. Estados personalizados necesitan ampliar category en src/flow.js. Ciclo: primer inicio hasta el cierre actual; un ticket reabierto deja de contar como cerrado. Históricos calculados sobre el conjunto actual de tickets seleccionados, no sobre tickets borrados o que perdieron la etiqueta. Las series diarias son instantáneas al final del día UTC (hoy hasta ahora).

ADO_BLOCKED_FIELD configura el campo de bloqueo, por defecto Microsoft.VSTS.CMMI.Blocked. Eficiencia aproximada: tiempo en estados activos sin bloqueo ni BoardColumnDone dividido por tiempo en estados activos. No representa automáticamente la definición exacta de columnas activas/espera de Power BI. Sin historial se muestran datos ausentes. El CSV conserva historial ausente. Explorar demo incluye transiciones sintéticas explícitamente identificadas para probar todas las gráficas.

Monte Carlo: semanas UTC completas, ceros incluidos, mínimo dos semanas y alguna entrega. Mil simulaciones, horizonte 520 semanas, resultados que exceden el horizonte sin fecha. No garantiza entrega. El P85 de antigüedad es un umbral empírico, no probabilidad condicional.

Pendiente de paridad: comparar con un dataset Power BI de la misma organización, filtros, calendario y mapeo de columnas; no se dispone de ese dataset en este checkout. No se portaron el servidor MCP, custom visuals de Power BI, backtesting ni pronóstico de cantidad a fecha. No son ejecutables directamente en Pages.

Validación: npm test; python -m unittest discover -s scripts -p "test_*.py"; npm run build. Actions ejecuta las pruebas antes de publicar. Las llamadas reales y despliegue requieren ejecutar el workflow con el secreto existente.
