# Informe Ejecutivo Final V181

## Cambio aplicado
Se corrigió un error puntual en las cajas en divisas: al anular una reserva cobrada por Zelle, USDT/Binance o Efectivo $, el sistema estaba descontando dos veces el valor de la devolución porque excluía el ingreso original de la reserva anulada y además registraba la devolución como egreso.

## Resultado esperado
La caja en divisas ahora calcula el saldo neto correctamente:

- Reserva cobrada en Zelle/Efectivo/Binance: suma a caja USD.
- Devolución/anulación por el mismo método: resta una sola vez.
- Saldo final refleja el neto real.

## Alcance protegido
No se modificaron reglas de caja Bs, compra de dólares, venta de dólares, reservas, mantenimiento, tasas, RRHH, inventario, documentos ni catálogos.
