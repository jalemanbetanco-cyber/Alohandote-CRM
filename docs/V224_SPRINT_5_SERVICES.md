# Alohandote CRM V224 Sprint 5 — Servicios de negocio

## Objetivo

Crear una capa inicial de servicios de negocio para que las próximas funciones no sigan creciendo dentro de `App.jsx`.

## Alcance aplicado

- `src/services/business/financeEngine.js`
- `src/services/business/calendarBusinessService.js`
- `src/services/business/icalSyncService.js`
- `src/services/business/documentGenerationService.js`
- `src/services/business/index.js`

## Regla de estabilidad

Este sprint no cambia comportamiento visual ni reglas aprobadas. Los servicios reutilizan núcleos existentes y quedan listos para migraciones graduales.

## Módulos congelados

No se modificó caja, reservas, CxP, CxC, iCal operativo, PDF, abonos, Firebase, inventario, RRHH ni ROI.
