# Informe Ejecutivo V175 · Reglas definitivas de caja

## Estado
Versión correctiva enfocada en lógica de caja por reservas.

## Cambios aplicados
- Se restringió Cuentas por cobrar únicamente a reservas con abono en Bs y saldo pendiente.
- Las reservas abonadas en Zelle, USDT o Efectivo $ ya no generan CxC en Bs.
- La caja disponible en Bs solo refleja dinero recibido en Bs y operaciones de divisas ya validadas.
- No se modificó compra/venta de divisas.
- Se mantiene separación entre Cuentas por pagar y egresos pagados.

## Prueba esperada
1. Reserva con abono en Bs: abono entra a caja Bs y diferencia entra a CxC.
2. Reserva con abono en Zelle: abono entra a caja Zelle y diferencia no entra a CxC Bs.
3. Gasto Por pagar: no descuenta caja hasta cambiar a Pagado.
4. Compra/Venta de $ funciona igual que V174.
