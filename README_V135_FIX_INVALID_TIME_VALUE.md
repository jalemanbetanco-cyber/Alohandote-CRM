# V135 - Fix Invalid time value

## Problema
El dominio principal mostraba:

`RangeError: Invalid time value`

## Causa
Alguna tarjeta de Administración ERP intentaba formatear una fecha vacía, indefinida o con texto no válido usando `Intl.DateTimeFormat`.

## Solución
Se endureció `src/dateUtils.js` para que las funciones de fecha no rompan la interfaz:

- `formatShortDate('')` devuelve `-`
- `formatShortDate(undefined)` devuelve `-`
- `formatShortDate('texto inválido')` devuelve `-`
- `monthTitle(fecha inválida)` devuelve `-`
- `rangesOverlap` e `isDateInsideRange` devuelven `false` si faltan fechas

## Impacto
- Administración ERP no debe romper por fechas inválidas.
- Monitor de salud, auditoría, backups y tablas pueden mostrar `-` cuando falte fecha.
- No cambia lógica de reservas ni cálculos.
