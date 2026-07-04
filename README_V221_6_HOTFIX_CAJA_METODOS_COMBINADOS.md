# V221.6 Hotfix Caja Métodos Combinados

## Objetivo
Corregir de forma quirúrgica la distribución de caja cuando una reserva tiene dos o más abonos con métodos distintos.

## Problema corregido
El sistema agregaba todos los abonos de una reserva en una sola fila de ingreso usando el método principal/actual de la reserva. En combinaciones como USDT + Bs, esto podía inflar Caja Bs o enviar todo el cobro a una caja incorrecta.

## Corrección
- Caja ahora genera una fila por cada abono congelado en `paymentHistory`.
- Cada fila conserva su método real: Bs, Zelle, USDT/Binance o $ efectivo.
- Cada fila conserva su monto Bs y USD congelado.
- La diferencia pendiente no se suma a caja.
- Alojamientos aliados mantienen proporcionalidad de ganancia Alohandote por abono.

## No se tocó
- Reservas
- PDFs
- iCal
- Renta Car calendario
- Aliados existentes
- Inventario
- RRHH
- ROI
- Backups

## QA
- Reserva con un abono USDT y otro Bs.
- Caja USD debe aumentar solo por el abono USDT.
- Caja Bs debe aumentar solo por el abono Bs.
- Total abonado histórico debe mantenerse congelado.
