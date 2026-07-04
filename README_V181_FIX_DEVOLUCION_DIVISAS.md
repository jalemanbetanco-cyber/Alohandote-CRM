# V181 · Fix puntual devolución en cajas USD

## Alcance
Corrección limitada únicamente al cálculo de caja para devoluciones/anulaciones de reservas cobradas en divisas:

- Zelle
- USDT / Binance
- Efectivo $

## Regla corregida
Cuando una reserva cobrada en divisas se anula con devolución:

1. El ingreso original se conserva como entrada histórica en la caja USD correspondiente.
2. La devolución se registra como salida en esa misma caja USD.
3. El saldo neto queda correcto y no se descuenta dos veces.

Ejemplo:

- Reserva Zelle: +100 USD
- Devolución Zelle: -100 USD
- Resultado neto Zelle: 0 USD

## No se tocó

- Caja Bs
- Compra de $
- Venta de $
- Cuentas por cobrar
- Cuentas por pagar
- Mantenimiento
- Tasas
- RRHH
- Inventario
- Fotos
- Catálogos
- Cotización
- Recibos
- Contratos
- Reglas Firebase
