# V223.5.2.2 — Hotfix Guardar Movimiento ERP

## Alcance quirúrgico
Corrección aislada al formulario `Administración ERP > Registrar movimiento`.

## Cambios aplicados
- El botón **Guardar movimiento** ahora ejecuta directamente `saveGeneralExpense` y no depende únicamente del submit del formulario.
- `saveGeneralExpense` ahora captura errores internos y muestra mensaje controlado en lugar de quedar sin respuesta.
- Se normaliza `transactionType` / `type` para ingresos y egresos.
- Se elimina `_invoiceFile` del payload antes de guardar para evitar conflictos con Firestore.
- Se conserva soporte de comprobante/factura.
- Se preserva la lógica de CxP aliados y Bs corregida en V223.5.2.1.

## No se tocó
- Reservas
- Abonos
- iCal
- PDFs
- Dashboard
- Roles
- CxP aliados estable
- Cajas por método estable

## Validación
- `npm run production:check` ✅
- `npm run build` ✅
