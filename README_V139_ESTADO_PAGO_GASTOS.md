# V139 - Estado de pago para gastos

## Problema corregido
Crear un artículo de inventario se estaba mostrando automáticamente como cuenta por pagar.

## Solución
Se agregó Estado de pago para gastos:

- Pagado
- Por pagar

## Inventario
Al crear/editar un artículo:
- Si Estado de pago = Pagado: descuenta la caja según tipo de pago.
- Si Estado de pago = Por pagar: aparece en Cuentas por pagar y no descuenta caja todavía.

## Mantenimiento
Al registrar mantenimiento:
- Si Estado de pago = Pagado: descuenta la caja correspondiente.
- Si Estado de pago = Por pagar: aparece en Cuentas por pagar.

## Cuentas por pagar
Ahora solo muestra:
- gastos marcados Por pagar,
- devoluciones pendientes,
- comisiones pendientes.
