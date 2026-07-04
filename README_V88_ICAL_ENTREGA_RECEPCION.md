# V88 - iCal incluido en Entrega / Recepción

## Cambio solicitado
El módulo Entrega / Recepción ahora SÍ toma en cuenta las reservas/bloqueos importados por iCal.

## Nueva regla
Para Alojamientos:
- Reservas internas pagadas/completadas se muestran normalmente.
- Reservas importadas por iCal también se muestran en Entrega / Recepción.
- Fecha inicio iCal = check-in / alojamiento por entregar.
- Fecha final iCal = check-out / alojamiento por recibir / limpieza pendiente.

## Importante
Los eventos iCal normalmente no traen:
- nombre real del huésped,
- teléfono,
- monto pagado,
- referencia de pago.

Por eso se muestran como:
- Alojamiento · iCal
- Reserva iCal / Airbnb / Booking
- Monto 0 si no existe información financiera.

## Se mantiene
- No se muestran fechas pasadas.
- Solo se muestran operaciones de hoy y próximos 2 días.
- Vehículos y alojamientos siguen segmentados.
- No se modifica Renta Car, Reservas, Administración, Inventario, RRHH, Mantenimiento, ROI ni iCal múltiple.
