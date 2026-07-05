# V221.5 Hotfix iCal Sync Safe

## Objetivo
Corregir de forma quirúrgica el comportamiento del botón **Sincronizar iCal guardado**.

## Corrección
- El botón **Sincronizar iCal guardado** solo sincroniza/refresca.
- No borra `icalUrl`.
- No borra `icalUrls`.
- No elimina bloqueos iCal existentes.
- No ejecuta lógica de desvinculación.
- Conserva los bloqueos actuales si el proveedor externo responde vacío, incompleto o con error.

## Acciones destructivas separadas
Solo estos botones pueden eliminar información:
- Desvincular iCal.
- Eliminar bloqueos iCal.

## Módulos no modificados
- Caja.
- Reservas manuales.
- Abonos.
- PDFs.
- Renta Car.
- Aliados.
- Firebase.
- Inventario.
- RRHH.
- ROI.
