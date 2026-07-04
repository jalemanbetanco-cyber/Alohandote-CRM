# Informe Ejecutivo Final V176 · Mantenimiento por pagar

## Estado
Versión correctiva sobre V175 enfocada únicamente en la regla de mantenimiento por pagar.

## Cambios aplicados

1. Renta Car / Mantenimiento:
   - Ahora se guarda `expenseStatus` en el registro de mantenimiento.
   - Si el estado es `Por pagar`, el gasto entra al dashboard en Por pagar y no descuenta caja.
   - Si el estado cambia a `Pagado`, recién se descuenta de la caja correspondiente.

2. Alojamientos / Mantenimiento:
   - Se agregó medio de pago y estado de pago en el formulario de mantenimiento.
   - Se guarda `maintenancePaymentMethod`, `expenseStatus`, `bcvDollarRate` y `maintenanceBsCost`.
   - Aplica la misma regla: Por pagar no afecta caja; Pagado sí afecta caja.

3. Sin cambios en módulos validados:
   - No se modificó compra/venta de divisas.
   - No se modificaron tasas.
   - No se modificó la lógica de caja de reservas.

## Validación
Pasaron smoke check, pruebas de negocio, seguridad estática, production gate y go-live preflight.
