# V146 - Anulación/Devolución flujo definitivo

## Problema corregido
La anulación mostraba el mensaje de éxito, pero el sistema reabría el modal de la reserva anulada y podía dar la impresión de que no completaba el flujo.

## Corrección
Al guardar la anulación/devolución:
- se actualiza la reserva con `status: cancelled`,
- se cierra el formulario de anulación,
- se cierra cualquier modal de reserva o alojamiento,
- se muestra `Anulación guardada con éxito`,
- el calendario excluye reservas anuladas,
- cuentas por cobrar excluye reservas anuladas,
- el egreso queda en Administración ERP como `Anulación / devolución`.

## Caja
Si el método de devolución es Bs, el monto del formulario se interpreta como USD a devolver y se convierte a Bs con la tasa EURO congelada al momento de anular.
