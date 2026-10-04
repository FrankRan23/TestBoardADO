# Centro de tickets: decisiones de producto

## Referencias consultadas

- [G2, Help Desk](https://www.g2.com/categories/help-desk): referencias de productos con reseñas, entre ellos Freshdesk, Zendesk y Zoho Desk. Es un ranking de productos, no una clasificación objetiva de diseño visual.
- [Zendesk: métricas de soporte](https://support.zendesk.com/hc/en-us/articles/4408832234394-Analyzing-the-metrics-that-matter-to-improve-customer-support): backlog, eficiencia y primera respuesta.
- [Zendesk: tiempo de respuesta](https://support.zendesk.com/hc/en-us/articles/4408821871642-Understanding-ticket-reply-time): una respuesta pública del agente no equivale a cualquier modificación.
- [Intercom: responsiveness reporting](https://www.intercom.com/help/en/articles/3653556-responsiveness-reporting): filtros y contexto de las métricas.
- [Microsoft: importar CSV](https://learn.microsoft.com/en-us/azure/devops/boards/queries/import-work-items-from-csv?view=azure-devops): restricciones al crear y actualizar work items.

## Implementado

Interfaz con navegación lateral, tarjetas accionables, filtros por fuente/responsable/prioridad, búsqueda, vistas rápidas, ordenación, paginación sin truncar el conjunto, detalle modal, exportación de la vista filtrada y diseño adaptable.

Indicadores: abiertos, prioridad P1/P2, espera de respuesta, inactividad, tiempo en estado, desviación de estimación, vencidos y próximos a vencer. Tendencia de creación/cierre (7/30/90 días), antigüedad del backlog y carga por responsable. Los filtros globales afectan las métricas; las vistas rápidas afectan la cola. El periodo solo afecta la gráfica de eventos.

## Definiciones y cobertura

- Cerrados: Closed, Done, Removed. Resolved sigue abierto hasta cierre; Removed se trata como terminal, por lo que este contador no mide entregas exitosas.
- Sin actividad: tiempo desde ChangedDate. Nunca se presenta como tiempo sin respuesta.
- Espera de respuesta: tiempo desde Custom.WaitingSince. Debe registrarse cuando una solicitud queda pendiente y limpiarse al responder. Se puede mapear otro campo mediante ADO_WAITING_FIELD. No se infiere el rol de una persona a partir de su nombre o comentario.
- Proceso lento: duración del estado actual desde StateChangeDate, con umbral configurable (7 días por defecto). No es un SLA contractual ni mide horas trabajadas.
- Fuera de objetivo: unión sin duplicados de proceso lento, fecha objetivo vencida y trabajo realizado + restante superior a Original Estimate.
- Objetivo: TargetDate por defecto; ADO_DUE_FIELD permite mapear otro campo disponible en el proceso.
- Tendencia: eventos de creación y último cierre disponibles en la instantánea, agrupados por UTC. No reconstruye reaperturas ni backlog histórico.
- Se usan días naturales; no se descuentan fines de semana ni estados en pausa.
- Datos ausentes: se muestran como desconocidos y se informa cobertura. El CSV original no prueba el estado actual, identidad de asignados ni antigüedad. Sus IDs CSV-n son referencias de fila, no IDs de Azure DevOps.

## Próximas capacidades que requieren datos nuevos

1. SLA de primera y siguiente respuesta: eventos con rol de solicitante/agente, calendario laboral y reglas de pausa.
2. Lead time y cycle time P50/P90, reaperturas y diagrama de flujo acumulado: historial de transiciones o snapshots diarios persistidos.
3. Bloqueos y dependencias: vínculos y estados de impedimento.
4. CSAT y resolución al primer contacto: encuestas y eventos de contacto.
5. Capacidad real del equipo: disponibilidad, horas y pesos de trabajo; el número de tickets no mide productividad individual.
6. Alertas externas y asignación: backend autenticado con permisos de escritura. Esta versión es analítica de solo lectura.

Estas métricas no se inventan a partir de un CSV de títulos y prioridades.
