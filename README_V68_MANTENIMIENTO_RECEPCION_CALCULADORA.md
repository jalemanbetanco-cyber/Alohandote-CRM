# V68 - Mantenimiento, recepción y calculadora

## Correcciones principales
- Cerrar el formulario de mantenimiento sin guardar ya no cambia el módulo a Renta Car.
- En el módulo Mantenimiento se agregan acciones Editar y Eliminar para registros guardados.
- La calculadora de Renta Car se recalcula al cambiar kilometraje, fechas, costo por día y costo total.
- Al guardar recepción, la reserva relacionada se marca como `returned` / devuelto.
- Al guardar recepción, la reserva sale de la lista de pendientes.
- El kilometraje recibido actualiza el vehículo y sirve para próximas cotizaciones y mantenimientos.
- Se mejoró la visual de Pendientes de recepción hoy y Próximas recepciones.
- El estado Devuelto tiene estilo visual propio.

## Nota
Esta versión se entrega sin package-lock.json para evitar errores de Vercel con registry interno.
