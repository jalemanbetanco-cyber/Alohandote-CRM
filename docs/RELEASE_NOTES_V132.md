# Release Notes V132

## Versión
V132 - Cierre técnico y checklist de producción

## Base acumulada
- V123 Auditoría funcional.
- V124 Links públicos seguros con token.
- V125 Sincronización de submissions públicas.
- V126 Servicios modulares base.
- V127 Pruebas automáticas de negocio.
- V128 Validaciones críticas antes de guardar.
- V129 Backups y exportación técnica.
- V130 Monitor de salud.
- V131 Optimización mobile/web UX.

## Nuevo en V132
- Servicio `productionChecklistService.js`.
- Checklist técnico de producción.
- Criterio GO / PENDING / NO-GO.
- Plan de despliegue.
- Plan de rollback.
- Flujos críticos de regresión manual.
- Pruebas automáticas para readiness.

## Riesgos pendientes
- El sistema sigue teniendo un `App.jsx` grande; la modularización debe continuar gradualmente.
- Falta backend Cloud Functions para aislar acciones críticas del cliente.
- Falta prueba end-to-end con Playwright/Firebase Emulator.
- Falta App Check y monitoreo externo avanzado.

## Recomendación de uso
No usar como producción masiva hasta completar la regresión manual y confirmar monitor de salud sin críticos.
