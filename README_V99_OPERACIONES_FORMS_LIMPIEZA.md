# V99 - Formularios operativos y limpieza con inventario

## 1. Alojamientos iCal duplicados / sin vincular
Se ajusta el módulo de Alojamientos > Check-in / Check-out para no mostrar eventos iCal sin vínculo confiable como tareas operativas.
Esto evita que aparezcan varios "Alojamiento sin vincular" cuando realmente solo hay un alojamiento planificado.

Los eventos iCal con alojamiento resuelto sí se mantienen visibles.

## 2. Renta Car - Formularios de entrega y recepción
Los botones ahora abren formularios:

### Entrega
- Responsable de entregar
- KM salida
- Combustible
- Estado general
- Foto tablero
- Foto vehículo
- Observación

Al guardar:
- Marca la reserva como entregada.
- Guarda deliveryKm / kmEntrega.
- Actualiza km actual del vehículo.

### Recepción
- Responsable de recibir
- KM entrada
- Combustible
- Estado general
- Foto tablero
- Foto vehículo
- Observación

Al guardar:
- Marca la reserva como devuelta.
- Calcula km recorridos.
- Actualiza kilometraje del vehículo.
- Alimenta el ROI.

## 3. Alojamientos - Formulario de limpieza
En Check-out / Limpieza, el botón "Marcar limpieza" abre un formulario con:
- Responsable de limpieza
- Foto de daño / incidencia
- Artículo usado
- Cantidad usada
- Observación

Al guardar:
- Marca limpieza como completada.
- Marca check-out como completado.
- Descuenta inventario si se selecciona artículo.
- Registra movimiento de inventario como salida por limpieza.
- Cuenta la limpieza realizada por alojamiento.

## 4. Mensaje final
Al completar limpieza muestra:
- Limpieza realizada con éxito

Y elimina la tarea pendiente.
