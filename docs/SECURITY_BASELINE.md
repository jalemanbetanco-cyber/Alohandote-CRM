# Security baseline Alohandote

## Controles mínimos
1. No usar reglas Firebase públicas.
2. Delete solo admin.
3. Storage solo autenticado y limitado por tipo/tamaño.
4. Roles normalizados.
5. Links públicos deben migrar a token seguro.
6. Datos sensibles: comprobantes, facturas, cédulas y fotos no deben quedar públicos.

## Próximas fases recomendadas
- V123: Auditoría funcional de acciones críticas.
- V124: Tokens seguros para logística pública.
- V125: Separación progresiva de servicios por módulo.
- V126: Pruebas automatizadas unitarias de pagos, fechas e iCal.


## V124 - Links públicos con token
- El link público de operaciones ya no debe abrirse sin token.
- El token se guarda en `publicReceptionTokens`.
- Las tareas públicas se envían como `publicOperationSubmissions`.
- El link tiene vencimiento y puede desactivarse.
- El personal externo no recibe acceso directo a todas las reservas.

## V125 - Sincronización segura de operaciones públicas
- Las operaciones del link público se guardan como submissions.
- Las reservas internas solo se modifican al sincronizar desde administración/supervisión.
- Se registra auditoría de la sincronización.
