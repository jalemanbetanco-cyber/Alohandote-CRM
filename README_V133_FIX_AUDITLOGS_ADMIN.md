# V133 - Fix auditLogsStore en Administración ERP

## Problema
Al entrar al módulo Administración ERP en el dominio principal aparecía:

`ReferenceError: auditLogsStore is not defined`

## Causa
Las tarjetas de auditoría, monitor de salud y backup usaban `auditLogsStore`, pero la store no estaba declarada en el componente.

## Solución
Se agregó:

`const auditLogsStore = useFirestoreOrLocalStorage('auditLogs', [], canUseCloudData && (isAdmin || currentRole === 'supervisor'))`

También se protegieron las lecturas con fallback seguro:

`auditLogsStore?.items || []`

## Impacto
- Administración ERP no debe romper al entrar.
- Auditoría reciente vuelve a tener fuente de datos.
- Monitor de salud y backup ya no fallan por variable indefinida.
- No cambia la lógica de reservas, caja, alojamientos, mantenimiento ni inventario.
