# V100 - Link público logística con formularios completos

## Cambio principal
El link público `?operaciones=1` ahora usa la misma lógica de formularios operativos que los submódulos internos.

## Renta Car
### Abrir entrega
Abre formulario con:
- Responsable de entregar
- KM salida
- Nivel de combustible
- Estado general
- Foto tablero
- Foto vehículo
- Observación

### Abrir recepción
Abre formulario con:
- Responsable de recibir
- KM entrada
- Nivel de combustible
- Estado general
- Foto tablero
- Foto vehículo
- Observación

Al guardar recepción:
- Marca la reserva como devuelta.
- Calcula kilometraje recorrido.
- Actualiza kilometraje del vehículo.
- Alimenta ROI.

## Alojamientos
### Marcar limpieza
Abre formulario con:
- Alojamiento
- Responsable de limpieza
- Foto de daño/incidencia
- Artículo usado
- Cantidad
- Observación

Al guardar:
- Marca limpieza como completada.
- Marca check-out como completado.
- Descuenta inventario si se selecciona artículo.
- Crea movimiento de inventario como salida por limpieza.
- Elimina la tarea pendiente del panel operativo.

## Botones públicos
El link público ahora decide automáticamente:
- Vehículo + entrega = Abrir entrega
- Vehículo + recepción = Abrir recepción
- Alojamiento + check-out = Marcar limpieza
- Alojamiento + check-in = Marcar entregado
