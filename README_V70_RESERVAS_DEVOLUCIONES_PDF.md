# V70 - Reservas, PDF y devoluciones

## Cambios
- Al abrir una reserva desde el módulo Reservas, el sistema ya no cambia automáticamente al módulo Renta Car/Alojamientos. Permanece en Reservas al guardar/cerrar.
- Los botones Recibo PDF y Contrato PDF usan apertura anticipada de ventana para mejorar compatibilidad móvil/navegador.
- Eliminar desde el formulario hace eliminación definitiva: borra la reserva del calendario y de los registros.
- Si existe una cotización/lead asociada generada como cliente, también se limpia para no ensuciar la data.
- Se agregó botón Devolución para reservas con abono.
- Devolución cambia la reserva a estado `cancelled`, guarda monto devuelto, motivo, fecha de anulación y mantiene el registro para contabilidad.
- Las reservas anuladas no bloquean calendario ni chocan con nuevas reservas.
- Las reservas anuladas permanecen en el módulo Reservas para auditoría/contabilidad.

## Recomendación contable
Usar:
- Eliminar = error operativo, borra definitivo.
- Devolución = cancelación real de cliente, conserva registro contable.
