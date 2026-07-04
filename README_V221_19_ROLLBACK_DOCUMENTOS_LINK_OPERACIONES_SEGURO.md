# V221.19 — Rollback Documentos + Link Operaciones Seguro

## Objetivo
Reparación quirúrgica después de V221.14–V221.18.

## Cambios
- Se elimina definitivamente `ops=` del link público de logística.
- El link vuelve a ser corto: `/?operaciones=1&token=<token>`.
- Las tareas se guardan en `publicReceptionTokens/{token}`.
- El colaborador externo lee el token activo desde Firebase sin iniciar sesión.
- Se desactiva el listado público de tokens: solo `get` por token exacto.
- Se revierte la capa de documentos/preview al flujo estable previo para no seguir degradando la operación.

## No tocado
Caja, reservas, abonos, iCal, ROI, inventario, RRHH, lógica financiera y reservas manuales.

## Validación
```bash
npm run production:check
npm run build
```
