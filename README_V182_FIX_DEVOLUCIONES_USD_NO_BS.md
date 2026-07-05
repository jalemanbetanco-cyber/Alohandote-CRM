# V182 · Fix devolución en divisas sin registro Bs

## Cambio puntual aplicado

Se corrigió únicamente el resumen/KPI de **Devoluciones** para que las anulaciones con devolución en:

- Zelle
- USDT / Binance
- Efectivo $

no generen registro ni equivalente en Bs dentro del campo **Devoluciones** del dashboard administrativo.

## Regla definitiva

- Reserva cobrada en Bs + devolución en Bs → se registra en Devoluciones Bs.
- Reserva cobrada en Zelle / USDT / Efectivo $ + devolución en esa misma divisa → afecta solo la caja USD correspondiente.
- Las devoluciones en divisas no alimentan el KPI Devoluciones Bs.

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
- Cotizaciones, contratos y recibos
- Reglas Firebase
