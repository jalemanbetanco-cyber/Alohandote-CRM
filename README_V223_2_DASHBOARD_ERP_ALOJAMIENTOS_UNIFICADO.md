# V223.2 — Dashboard ERP Alojamientos Unificado

## Objetivo
Corregir la incongruencia del dashboard del módulo Alojamientos haciendo que todas las tarjetas lean de una sola fuente de verdad mensual y por alojamiento seleccionado.

## Cambios quirúrgicos
- Se crea `accommodationDashboard` como cálculo único para KPIs de alojamientos.
- Las tarjetas `Noches ocupadas`, `Total hospedaje`, `Reservas`, `No disponible` y `Mantenimientos` se alimentan desde el mismo dataset.
- El cálculo se limita al mes visible (`currentMonth`) y al alojamiento seleccionado.
- Se excluyen reservas anuladas/canceladas/devoluciones.
- `Noches ocupadas` calcula solo noches reservadas dentro del mes visible.
- `Total hospedaje` calcula hospedaje base, priorizando noches × tarifa; si falta tarifa, prorratea total menos limpieza.

## Módulos no tocados
- Caja
- Abonos
- Comisiones
- CxC / CxP
- Renta Car
- PDFs
- iCal
- RRHH
- Inventario
- ROI
- Operaciones

## Validación ejecutada
`npm run production:check`

Resultado: OK.
