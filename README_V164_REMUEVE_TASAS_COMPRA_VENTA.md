# V164 - Remueve tasas de Administración y desbloquea compra/venta de divisas

## Cambios aplicados

1. Se eliminó del módulo Administración ERP el panel visible de tasas: EURO BCV, $ BCV, USDT/Mercado y botón Actualizar tasas.
2. Se eliminó el aviso amarillo de tasas dentro de Administración.
3. El formulario Compra de $ / Venta de $ ya no bloquea Guardar por saldos derivados contaminados o inconsistentes.
4. Compra/Venta de divisas mantiene el ledger firmado:
   - Compra: +USD en método seleccionado y -Bs en caja.
   - Venta: -USD en método seleccionado y +Bs en caja.
5. El formulario tiene noValidate para evitar bloqueos silenciosos del navegador.

## Prueba obligatoria

- Abrir Administración ERP y confirmar que no aparecen EURO BCV, $ BCV, USDT ni Actualizar tasas.
- Abrir Compra de $, llenar monto/tasa y guardar.
- Abrir Venta de $, llenar monto/tasa y guardar.
- Verificar que la caja se recalcula al cerrar el modal.
