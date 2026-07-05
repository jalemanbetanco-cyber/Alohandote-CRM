# V150 - Operaciones iCal y anulación final

## Problemas corregidos
1. El botón de anulación/devolución podía no ejecutar correctamente el flujo si no se cargaba comprobante o si el submit del formulario no disparaba.
2. Las reservas iCal sin alojamiento vinculado seguían apareciendo en operaciones.
3. Las operaciones debían recalcularse al modificar reservas/anulaciones.

## Correcciones
- El botón `Guardar anulación/devolución` ahora ejecuta la acción directamente.
- El comprobante queda permitido, pero ya no bloquea el flujo si no fue cargado.
- Si el comprobante falla al subir, se conserva referencia local del archivo.
- Al anular:
  - status pasa a `cancelled`;
  - se marca `receivableClosed`;
  - se marca `calendarReleased`;
  - se registra `adminExpenseRegistered`;
  - se recalcula operaciones;
  - sale de cuentas por cobrar.
- iCal solo se muestra en operaciones si está vinculado a un alojamiento real.
- iCal vinculado se deduplica con reservas internas por alojamiento/fecha/operación.

## Resultado esperado
- Sin `Alojamiento sin vincular` en operaciones.
- Nuevas reservas o cambios de fecha actualizan operaciones.
- Anulación ejecuta flujo completo.
