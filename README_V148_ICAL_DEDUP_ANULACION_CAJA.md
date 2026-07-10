# V148 - iCal deduplicado y anulación con caja por método

## iCal en operaciones
Las reservas iCal vuelven a mostrarse en operaciones cuando corresponda, pero sin duplicar:
- si existe reserva interna para el mismo alojamiento, fecha y operación, se muestra la interna;
- si solo existe iCal, se muestra iCal;
- siempre se intenta resolver el nombre real del alojamiento.

## Anulación / devolución
Al anular una reserva:
- se desbloquea calendario con `status: cancelled`;
- sale de cuentas por cobrar;
- queda documentada como egreso en Movimientos derivados;
- descuenta caja según método de devolución:
  - Bs descuenta caja Bs;
  - Zelle descuenta Zelle;
  - Efectivo descuenta Efectivo;
  - USDT/Binance descuenta Binance.
