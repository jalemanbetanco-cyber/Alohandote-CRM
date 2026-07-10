# V128 - Validaciones críticas antes de guardar

## Objetivo
Evitar que errores operativos entren al sistema antes de guardar.

## Qué se agregó
Nuevo servicio:

`src/domain/validations.js`

## Qué valida
- Fechas obligatorias y con orden correcto.
- Abonos no mayores al total.
- Montos no negativos.
- Kilometraje obligatorio y no negativo.
- Limpieza con responsable.
- Operaciones públicas con identificador de tarea.
- Conflictos de calendario.
- iCal excluido de conflictos internos de alojamiento.

## Integración aplicada
Las validaciones se conectaron en:
- saveReservation
- saveLodging
- saveVehicleDelivery
- saveVehicleReception
- saveCleaningTask
- savePublicOperationSubmission

## Pruebas
Se agregaron casos al archivo:

`tests/business-rules.test.mjs`

## No cambia
- Diseño.
- Datos existentes.
- iCal.
- Caja.
- Inventario.
- RRHH.
- Flujos internos principales.

Esta versión endurece la entrada de datos sin cambiar el funcionamiento visible del sistema.
