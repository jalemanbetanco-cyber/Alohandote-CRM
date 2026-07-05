# V102 - Link público con formulario independiente en la misma pestaña

## Corrección solicitada
El formulario ya no abre una pestaña adicional.

## Nuevo comportamiento
En `?operaciones=1`:
- Al hacer clic en Abrir entrega, Abrir recepción o Marcar limpieza, el sistema navega en la misma pestaña a:
  `?operaciones=1&tarea=<id>`
- Esa vista muestra únicamente el formulario correspondiente.
- La lista de tareas queda oculta mientras el formulario está abierto.

## Botón volver / cancelar
Cada formulario incluye:
- Volver / cancelar

Ese botón regresa al listado de tareas sin guardar cambios.

## Después de guardar
Cuando se guarda una entrega, recepción o limpieza:
- Se guarda la operación.
- Se marca la tarea como completada.
- Se vuelve automáticamente al listado de tareas.
