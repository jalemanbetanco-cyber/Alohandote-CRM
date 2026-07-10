# V222.1.1 Hotfix Startup

## Objetivo
Corregir el error crítico de arranque `normalizeText is not defined` detectado en producción después de V222.1.

## Cambio aplicado
- Se elevó `normalizeText(value)` a scope global de `App.jsx`, antes de cualquier uso en funciones auxiliares de módulo.
- Se eliminó la definición duplicada interna para evitar sombras o inconsistencias.

## Módulos no tocados
- Caja
- Reservas
- Abonos
- PDFs
- iCal
- ROI
- Mantenimientos
- Roles/Logística fuera del error de arranque

## Validación
- `npm run production:check`: aprobado.
- `npm run build`: no validado en este entorno porque falta `vite/node_modules`.
