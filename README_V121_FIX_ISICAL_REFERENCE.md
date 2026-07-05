# V121 - Fix isIcalImportedBlock no definido

## Problema
Después de V120, el sistema podía romper al cargar con:

Uncaught ReferenceError: isIcalImportedBlock is not defined

## Causa
La función global `isMaintenanceRecord()` estaba llamando a `isIcalImportedBlock()`, pero `isIcalImportedBlock()` vive dentro del componente App.
Por eso, al ejecutarse desde helpers globales, no existía en ese alcance.

## Corrección
Se creó un detector global:

isIcalImportedRecord(item)

Y ahora:
- `isMaintenanceRecord()` usa `isIcalImportedRecord()`.
- `isIcalImportedBlock()` queda dentro de App, pero delega en el detector global.

## Se mantiene la corrección V120
- Las reservas iCal no aparecen como mantenimiento.
- `maintenanceType` por sí solo no clasifica mantenimiento.
- Las reservas de alojamiento nuevas no nacen con `maintenanceType: Preventivo`.

## Validación
1. Abrir sistema.
2. Entrar al módulo Mantenimiento.
3. Confirmar que no aparezcan reservas iCal como mantenimiento.
4. Confirmar que sí aparezcan mantenimientos reales.
