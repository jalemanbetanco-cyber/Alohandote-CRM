# Informe Ejecutivo V172

La V172 corrige la separación de caja real y cuentas por cobrar según moneda/método de pago.

## Decisión funcional

- Dinero cobrado en USD entra a su billetera USD correspondiente.
- Dinero cobrado en Bs entra a Caja Bs.
- Cuentas por cobrar en Bs solo muestra pendiente de reservas cuyo abono fue en Bs.
- Pendientes de reservas abonadas en Zelle/Efectivo $/USDT no se cargan en Bs ni inflan caja.

Estado: candidata a prueba QA focalizada de caja.
