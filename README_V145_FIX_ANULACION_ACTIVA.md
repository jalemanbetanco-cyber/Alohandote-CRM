# V145 - Fix botón Anulación/Devolución activo

## Problema corregido
El botón `Anulación/Devolución` parecía congelado porque el nuevo formulario podía quedar detrás del modal de reserva abierto.

## Solución
Al presionar `Anulación/Devolución`:
- Se cierra el modal de reserva actual.
- Se abre el formulario formal de anulación/devolución.
- Se exige comprobante, referencia, método y monto.
- Al guardar muestra exactamente: `Anulación guardada con éxito`.

## Flujo contable
Al guardar:
- la reserva pasa a `cancelled`,
- deja de bloquear calendario,
- sale de cuentas por cobrar,
- registra egreso en Administración ERP como `Anulación / devolución`,
- ya no se incluye como cuenta por pagar, porque es una salida ejecutada,
- conserva motivo, referencia y comprobante.
