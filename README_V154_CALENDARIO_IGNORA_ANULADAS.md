# V154 - Calendario ignora reservas anuladas/devoluciones

## Problema corregido
El formulario de nueva reserva mostraba conflicto contra una reserva ya anulada:

`Ese rango choca con Anulada / devolución...`

## Causa raíz
El módulo de validaciones críticas (`src/domain/validations.js`) usa `normalizeStatus` desde `src/domain/maintenance.js`.

Aunque `App.jsx` ya reconocía `cancelled`, el dominio compartido todavía no reconocía:
- cancelled
- cancelada
- anulada
- anulación/devolución

Por eso la validación trataba la reserva anulada como si siguiera reservada.

## Corrección
- Se actualizó `src/domain/maintenance.js`.
- Se agregó `isRecordCancelled`.
- `validateNoDateConflict` ahora ignora cualquier registro anulado, con `refundAt`, `cancelledAt`, `receivableClosed`, `calendarReleased` o `cancellationType`.

## Resultado esperado
Una reserva anulada:
- no bloquea calendario,
- no genera choque al crear/editar reservas,
- conserva trazabilidad en ERP y movimientos.
