# V215 - Panel de Salud Operacional

## Objetivo
Agregar una capa técnica de monitoreo preventivo para detectar inconsistencias operativas antes de que afecten la gestión del CRM.

## Alcance implementado
- Nuevo módulo `src/modules/health/`.
- Detección de abonos sin movimiento de caja.
- Detección de reservas con saldo pendiente sin CxC abierta.
- Detección de alojamientos aliados con monto propietario sin CxP abierta.
- Detección de eventos iCal sin reserva local equivalente.
- Resumen de salud por módulo y severidad.
- Pruebas `test:v215` integradas al `production:check`.

## No se modificó
- App.jsx.
- Caja.
- Reservas.
- Abonos.
- PDFs.
- Calendario.
- Renta Car.
- iCal funcional.
- Firebase.
- Aliados.
- RRHH, Inventario y ROI.

## Comandos
```bash
npm run test:v215
npm run production:check
npm run build
```

## Criterio GO/NO-GO
- Críticos = NO-GO operativo.
- Warnings = revisar antes de cierre mensual.
- OK = sistema sin inconsistencias detectadas por esta capa.
