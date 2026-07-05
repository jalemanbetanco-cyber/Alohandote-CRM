# V89 - Operaciones logística / limpieza

## Correcciones principales

### 1. Reservas iCal con nombre correcto del alojamiento
Los eventos iCal ya no deberían mostrarse como "ALOJAMIENTO" genérico cuando exista relación con un alojamiento configurado.
La lógica intenta resolver el nombre por:
- accommodationId
- URL iCal vinculada al alojamiento
- nombre guardado en el registro importado

Además, las nuevas importaciones iCal guardan `accommodationName` desde el alojamiento seleccionado.

### 2. Link público para logística y limpieza
Se agrega un link público:
`/?operaciones=1`

Este link permite al equipo marcar operaciones sin entrar al panel admin:
- Vehículo entregado
- Check-in realizado
- Limpieza/check-out realizado
- Abrir recepción de vehículo para cargar kilometraje

### 3. Los botones ya no sacan del módulo
Los botones del dashboard ahora ejecutan la acción directamente:
- Vehículo entregado
- Check-in realizado
- Limpieza realizada

Al marcar una operación, el sistema actualiza la reserva y deja de mostrarla como pendiente.

### 4. Limpiezas por alojamiento
Al marcar check-out / limpieza realizada, se guarda:
- cleaningStatus
- cleaningCompletedAt
- cleaningBy

El módulo muestra el conteo de limpiezas realizadas por alojamiento.

## Nota
Los eventos iCal antiguos que fueron importados antes de esta versión y no tengan accommodationId ni icalSourceUrl podrían seguir apareciendo genéricos. Al desvincular/sincronizar nuevamente se guardarán con mejor referencia.
