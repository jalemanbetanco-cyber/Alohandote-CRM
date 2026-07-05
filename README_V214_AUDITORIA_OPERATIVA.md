# V214 Auditoría Operativa Integral

Base congelada: V213 STABLE.

## Objetivo
Agregar una capa paralela de auditoría para acciones críticas del CRM sin alterar los flujos operativos existentes.

## Cambios técnicos
- `src/modules/audit/auditTypes.js`
- `src/modules/audit/auditHelpers.js`
- `src/modules/audit/auditRepository.js`
- `src/modules/audit/auditService.js`
- `tests/v214-audit-module.test.mjs`

## Alcance funcional preparado
La auditoría queda lista para registrar:
- Reservas de alojamientos y renta car.
- Abonos creados, editados o eliminados.
- Cuentas por cobrar y pagar.
- Cambios manuales de caja.
- Cambios de aliados.

## Seguridad
- Los valores sensibles se redactan antes de guardar logs.
- Los logs se construyen como registros inmutables.
- Firestore ya contiene regla para `auditLogs` desde la base V207.

## No modificado
- `src/App.jsx`
- Caja
- Reservas
- Abonos
- PDFs
- Calendario
- iCal
- Firebase funcional
- Aliados
- RRHH / Inventario / ROI
