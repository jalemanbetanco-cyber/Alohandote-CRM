# V79 - Fecha de creación inmutable

## Cambio principal
La fecha de creación (`createdAt`) ya no se reemplaza cuando se edita una cotización o reserva.

## Regla aplicada
- Al crear una cotización/reserva: se guarda `createdAt`.
- Al editar una cotización/reserva: se conserva el `createdAt` original.
- Al editar: se actualiza `updatedAt` y `lastModifiedAt`.

## Ejemplo
- Cotización creada: 08/06/2026 -> `createdAt = 2026-06-08`
- Cotización editada: 09/06/2026 -> `createdAt` sigue 08/06/2026 y `lastModifiedAt = 2026-06-09`

## Nota
Esto permite que el motor de búsqueda por fecha siga filtrando por la fecha inicial de creación y no por la fecha de edición.
