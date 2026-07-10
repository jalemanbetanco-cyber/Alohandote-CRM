# V221.7 Hotfix iCal Reconcile

## Objetivo
Corregir la sincronización iCal para que Airbnb, Estei y cualquier calendario externo puedan modificar, cancelar o acortar reservas y Alohandote actualice sus bloqueos importados sin desvincular el calendario.

## Cambios
- Reconciliación por `externalUid` estable cuando el proveedor entrega UID.
- Actualización de fechas existentes cuando cambia DTSTART/DTEND.
- Liberación de bloqueos iCal que ya no vienen en el feed externo.
- Creación de nuevos bloqueos externos.
- Protección: no toca reservas manuales ni reservas internas.
- Protección: no borra `icalUrl` ni `icalUrls`.
- Funciona para Airbnb, Estei y otros iCal externos.

## Resultado esperado
Si Airbnb cambia una salida de 28-06 a 27-06, al sincronizar se actualiza el bloqueo importado y se libera la noche que ya no viene en el calendario externo.

## Módulos no tocados
Caja, abonos, PDFs, Renta Car, aliados, inventario, RRHH, ROI y reservas manuales.
