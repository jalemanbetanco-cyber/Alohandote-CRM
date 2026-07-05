# V80 - Sistema anterior + base ERP + múltiples iCal

## Cambio principal
Se conserva la estructura del sistema anterior y se agrega soporte para hasta 4 calendarios iCal externos por alojamiento.

## iCal múltiple
En el formulario de creación/edición de alojamiento ahora puedes guardar:
- URL iCal #1
- URL iCal #2
- URL iCal #3
- URL iCal #4

Sirve para vincular Airbnb, Booking u otros calendarios externos al mismo alojamiento.

## Sincronización
El botón "Sincronizar iCal guardado" ahora:
- lee hasta 4 enlaces guardados,
- limpia los bloqueos iCal anteriores del alojamiento,
- importa los eventos de cada calendario,
- evita duplicados usando fuente + UID + fechas,
- conserva tus reservas manuales.

## Desvincular
El botón "Desvincular iCal" ahora borra las 4 URL y libera los bloqueos importados por iCal.

## Nota
La sincronización sigue dependiendo de que el proveedor permita leer el archivo .ics por URL y de que el proxy /api/ics-proxy responda correctamente.
