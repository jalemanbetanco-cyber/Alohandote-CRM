# V152 - Fix botón Guardar Anulación/Devolución accionable

## Causa probable
El botón quedaba percibido como deshabilitado o no ejecutaba el flujo cuando faltaba referencia o cuando el botón inferior del modal quedaba en una zona poco accesible.

## Corrección
- El formulario ahora usa submit nativo.
- Se agregó un botón de guardado adicional arriba del formulario.
- La referencia ya no bloquea la anulación: si queda vacía, el sistema genera una automática.
- El botón tiene protección CSS para permanecer accionable.
- El egreso siempre conserva método de devolución.

## Flujo esperado
Al guardar:
1. Se anula la reserva.
2. Se libera calendario.
3. Sale de cuentas por cobrar.
4. Se registra egreso en Administración ERP.
5. Se descuenta la caja según método.
6. Se muestra `Anulación guardada con éxito`.
