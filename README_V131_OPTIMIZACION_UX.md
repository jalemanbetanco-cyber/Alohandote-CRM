# V131 - Optimización mobile/web final y limpieza UX

## Objetivo
Pulir la experiencia visual y de uso del sistema sin tocar la lógica de negocio.

## Qué se agregó

### Servicio UX
`src/services/uxService.js`

Incluye funciones puras para:
- densidad mobile/web
- tamaño mínimo táctil
- estados vacíos legibles
- criterio de tabla responsive
- checklist UX

### CSS responsive
Se agregaron mejoras en `src/styles.css`:
- Botones más cómodos en mobile.
- Inputs con tamaño correcto para iOS.
- Focus visible.
- Tablas con scroll horizontal.
- Formularios con acciones sticky en mobile.
- Modales con scroll seguro.
- Mejoras de impresión.
- Soporte para `prefers-reduced-motion`.

## No cambia
- Reservas.
- Caja.
- iCal.
- Mantenimiento.
- Inventario.
- RRHH.
- Permisos.
- Backups.
- Auditoría.
- Salud del sistema.

## Pruebas
Se agregaron pruebas automáticas para `uxService`.
