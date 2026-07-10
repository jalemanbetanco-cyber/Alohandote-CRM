# V151 - Fix definitivo de anulaciones, calendario y caja

## Causa raíz encontrada
La función `normalizeStatus()` no reconocía `cancelled`, `cancelada`, `anulada` ni variantes de anulación.

Por eso una reserva anulada se seguía interpretando como `reserved`.

## Qué provocaba
- Seguía bloqueando calendario.
- Seguía saliendo en cuentas por cobrar.
- No entraba correctamente como devolución/egreso.
- No descontaba caja como correspondía.

## Corrección
Se actualizó `normalizeStatus()` para reconocer:
- cancelled / canceled
- cancelada / cancelado
- anulada / anulado
- anulación / devolución
- devuelto / returned / completado

Además se agregó `isReservationCancelled()` como guardia única para:
- calendario,
- cuentas por cobrar,
- operaciones,
- ingresos,
- comisiones,
- devoluciones.

## Resultado esperado
Al guardar Anulación/Devolución:
1. La reserva deja de bloquear calendario.
2. Desaparece de cuentas por cobrar.
3. Aparece como egreso `Anulación / devolución`.
4. Descuenta la caja según método de devolución.
5. No genera comisión ni ingreso activo.
