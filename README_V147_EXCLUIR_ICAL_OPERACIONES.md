# V147 - Excluir iCal de operaciones / check-in / check-out

## Problema
Las reservas importadas por iCal/Airbnb se estaban mostrando en:
- Entrega / Recepción
- Check-in
- Check-out / Limpieza
- Link público de logística

Esto duplicaba información y alteraba la operación.

## Corrección definitiva
Las reservas iCal ahora solo cumplen su función correcta:

`bloquear calendario`

No se convierten en tareas operativas.

## Módulos impactados
- Recepción y entregas
- Check-in / Check-out
- Limpieza
- Link público de operaciones

## Lo que NO cambia
- iCal sigue bloqueando disponibilidad en calendario.
- iCal sigue visible donde corresponde para control de ocupación.
- Reservas internas siguen generando check-in, check-out y limpieza.
