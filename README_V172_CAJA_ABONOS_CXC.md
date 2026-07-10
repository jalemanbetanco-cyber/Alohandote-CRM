# Alohandote V172 · Caja real por método de pago y CxC correcta

## Cambios aplicados

1. Reservas con abono en Zelle, Efectivo $ o USDT:
   - El monto abonado entra solo a la caja USD correspondiente.
   - Si queda diferencia pendiente, NO se convierte ni se suma a Cuentas por cobrar en Bs.
   - La diferencia queda como pendiente operativo en USD dentro del detalle/export, pero no altera caja Bs ni dashboard Bs.

2. Reservas con abono en Bs:
   - El monto abonado entra a Caja Bs disponible.
   - La diferencia pendiente en Bs sí queda registrada como Cuentas por cobrar.
   - Cuando el pago queda completo, sale de Cuentas por cobrar.

3. Se mantiene la caja limpia con LOCAL_STORAGE_VERSION v172 para evitar arrastrar pruebas anteriores.

## Prueba recomendada

- Reserva 100 USD, abono Zelle 40 USD: Zelle +40 USD, Caja Bs 0, Por cobrar Bs 0.
- Reserva 100 USD, abono Pago en Bs 34.004 Bs con tasa 680,08: Caja Bs +34.004, Por cobrar Bs +34.004.
- Completar pago Bs restante: Por cobrar vuelve a 0 y Caja Bs suma lo cobrado.
