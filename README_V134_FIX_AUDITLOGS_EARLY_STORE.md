# V134 - Fix definitivo auditLogsStore temprano

## Problema
El dominio principal seguía mostrando:

`auditLogsStore is not defined`

## Corrección
Se movió/forzó la declaración de `auditLogsStore` inmediatamente después de `publicOperationSubmissionsStore`, antes de cualquier función, snapshot, backup, monitor o JSX que pueda leerla.

## Cambio técnico
`const auditLogsStore = useFirestoreOrLocalStorage('auditLogs', [], canUseCloudData && Boolean(user))`

Además, las lecturas quedan protegidas con:

`auditLogsStore?.items || []`

## Objetivo
Evitar que Administración ERP se rompa aunque:
- no existan registros de auditoría,
- el usuario no tenga datos cargados,
- Firebase tarde en responder,
- el módulo renderice auditoría/backup/salud.
