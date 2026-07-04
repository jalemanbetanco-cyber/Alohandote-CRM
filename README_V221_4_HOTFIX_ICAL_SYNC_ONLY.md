# V221.4 Hotfix iCal Sync Only

## Objetivo
Corregir de forma quirúrgica el botón **Sincronizar iCal guardado** para que únicamente sincronice/actualice calendarios externos y nunca desvincule URLs iCal ni elimine bloqueos importados si la nueva lectura no trae eventos importables.

## Cambios aplicados
- Se agregó validación previa de eventos importables antes de reemplazar bloqueos iCal existentes.
- Si Airbnb/Booking/otro iCal responde vacío o sin eventos parseables, el sistema conserva los bloqueos actuales.
- El botón Sincronizar iCal guardado no limpia `icalUrl` ni `icalUrls`.
- La sincronización silenciosa cada 10 minutos también conserva bloqueos previos si la lectura externa no trae eventos importables.
- La desvinculación queda reservada exclusivamente al botón **Desvincular iCal**.

## Alcance protegido
No se modificó:
- Caja
- Reservas manuales
- Abonos
- PDFs
- Renta Car
- Aliados
- Firebase
- Inventario
- RRHH
- ROI

## Validación
`npm run production:check` aprobado.

`npm run build` debe validarse en VS Code después de `npm install --legacy-peer-deps`.
