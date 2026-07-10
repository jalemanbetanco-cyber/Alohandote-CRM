# V221.2 Hotfix iCal Crash

## Objetivo
Corregir el error visual `icalSyncingAccommodationId is not defined` al abrir el calendario de alojamientos.

## Cambio quirúrgico
- Se declara el estado `icalSyncingAccommodationId` junto a los estados principales del componente.
- No se altera la lógica de reservas, caja, abonos, PDFs, Renta Car, aliados, iCal, Firebase, inventario, RRHH ni ROI.

## Validación
- `npm run production:check`: aprobado.
- `npm run build`: debe ejecutarse en VS Code con dependencias instaladas (`npm install --legacy-peer-deps`).

## QA mínimo
- Abrir calendario de cualquier alojamiento.
- Seleccionar fecha.
- Abrir formulario de reserva.
- Sincronizar iCal guardado.
- Verificar que no se desvincule automáticamente.
