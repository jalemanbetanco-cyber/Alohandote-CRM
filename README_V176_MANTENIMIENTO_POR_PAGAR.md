# Alohandote V176 · Mantenimiento por pagar sin afectar caja

## Alcance
Versión correctiva basada en V175. No modifica compra/venta de divisas ni las reglas de caja de reservas.

## Regla aplicada solo al módulo de mantenimiento

- Mantenimiento con estado **Por pagar**: se registra en el dashboard en **Por pagar**, pero no descuenta Caja disponible.
- Mantenimiento con estado **Pagado**: descuenta de la caja correspondiente según medio de pago.
- Al editar un mantenimiento y cambiar el estado de **Por pagar** a **Pagado**, recién ahí se descuenta de caja.

## Correcciones técnicas

- Se persistió `expenseStatus` en mantenimientos de Renta Car.
- Se agregó `expenseStatus`, `maintenancePaymentMethod`, `bcvDollarRate` y `maintenanceBsCost` a mantenimientos de Alojamientos.
- Se agregó selector de medio de pago y estado de pago en el formulario de mantenimiento de Alojamientos.
- Se mantiene intacta la lógica validada de reservas, caja, compra/venta de $ y tasas.
