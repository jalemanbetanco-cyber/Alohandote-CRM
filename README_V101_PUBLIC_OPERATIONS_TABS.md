# V101 - Link público logística sin check-in y formularios en pestaña

## Cambios

### 1. Link público sin check-in de alojamientos
En `?operaciones=1` ya no se muestran tareas de check-in / marcar entregado de alojamientos.

El link público solo muestra:
- Entregas de vehículos
- Recepciones de vehículos
- Limpiezas / check-out de alojamientos

### 2. Formularios en pestaña independiente
Al hacer clic en:
- Abrir entrega
- Abrir recepción
- Marcar limpieza

el sistema abre una nueva pestaña con el formulario correspondiente usando:
`?operaciones=1&tarea=<id>`

La pantalla principal queda como lista operativa y la pestaña nueva queda enfocada solo en el formulario.

### 3. Formulario de limpieza
El formulario público de limpieza incluye:
- Responsable de limpieza
- Foto daño/incidencia
- Artículos utilizados
- Cantidad utilizada
- Observación

### 4. Integración con inventario
Al guardar limpieza:
- Descuenta stock del artículo seleccionado.
- Registra movimiento de inventario como salida por limpieza.
- Marca limpieza/check-out como completado.
- La tarea deja de aparecer como pendiente.

## Nota
Si el navegador bloquea ventanas emergentes, el sistema redirige en la misma pestaña al formulario.
