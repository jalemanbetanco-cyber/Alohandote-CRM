# V153 - Guardar reservas activo y caja limpia

## Correcciones

### Guardar reserva
- El formulario de reserva usa `noValidate`.
- El botón `Guardar` ya no queda deshabilitado por estado visual.
- Ejecuta `saveReservation()` directamente.

### Caja Bs
- Las devoluciones inconsistentes no entran a caja ni a totales.
- La caja visible no muestra saldos negativos.
- La caja por método no muestra valores negativos.
- La alerta de movimientos excluidos fue eliminada de la interfaz.

## Flujo esperado
- Crear reserva: botón Guardar activo.
- Editar reserva: botón Guardar activo.
- Caja Bs: sin saldos negativos visibles.
- No aparece alerta de movimientos excluidos.
