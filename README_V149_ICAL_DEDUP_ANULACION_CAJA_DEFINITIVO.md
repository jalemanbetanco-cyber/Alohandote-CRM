# V149 - iCal deduplicado y anulación/caja definitiva

## Corrección iCal
Las reservas iCal vuelven a operaciones, pero sin duplicarse:
- se muestra una sola tarea por alojamiento, fecha y operación;
- si existe reserva interna y iCal para el mismo alojamiento/fecha/operación, se prioriza la interna;
- si solo existe iCal, se muestra iCal con nombre de alojamiento resuelto.

## Corrección anulación/devolución
La anulación ahora mantiene el flujo:
- status `cancelled` para liberar calendario;
- sale de cuentas por cobrar;
- documenta egreso como `Anulación / devolución`;
- aparece en movimientos derivados;
- descuenta caja según método de devolución:
  - Bs;
  - Zelle;
  - Efectivo;
  - USDT/Binance.

## Validaciones
Se actualizó smoke, production gate y pruebas de negocio.
