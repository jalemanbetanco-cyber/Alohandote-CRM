# V128 - Política de validaciones críticas

## Objetivo
Bloquear datos incorrectos antes de que entren en Firestore o en localStorage.

## Principios
1. Validar antes de subir archivos.
2. Validar antes de crear/editar documentos.
3. Validar cantidades, fechas y saldos.
4. No permitir abonos mayores al total.
5. No permitir kilometrajes negativos.
6. No permitir limpiezas sin responsable.
7. No permitir operaciones públicas sin taskId.

## Archivo principal
`src/domain/validations.js`

## Funciones agregadas
- validateReservationCritical
- validateLodgingCritical
- validateVehicleOperationCritical
- validateCleaningCritical
- validatePublicSubmissionCritical
- validatePaymentConsistency
- validateNoDateConflict

## Flujos protegidos
- Reserva Renta Car
- Reserva Alojamientos
- Entrega vehículo
- Recepción vehículo
- Limpieza alojamiento
- Submission pública
