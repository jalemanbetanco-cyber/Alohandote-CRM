# V220 Backup, Exportación y Recuperación

Base estable: V219 Continuidad Operacional.

## Alcance
- Nuevo módulo aislado `src/modules/backup/`.
- Exportación lógica JSON/CSV y descriptor para XLSX.
- Snapshot operacional con manifiesto y checksum SHA256.
- Validación previa de respaldos con `backup:validate`.
- Preparación de restauración en modo dry-run; no ejecuta escrituras.

## Principio de seguridad
No se modifican flujos operativos ni `App.jsx`. La restauración queda preparada pero no habilitada para producción.

## Comandos
```bash
npm run test:v220
npm run backup:validate
npm run production:check
npm run build
```

## Colecciones consideradas
- reservations
- cashMovements
- payments
- accountsReceivable
- accountsPayable
- inventoryItems
- hrPeople
- lodgings
- vehicles
- auditLogs

## No tocado
Caja, reservas, abonos, PDFs, calendario, renta car, iCal, Firebase funcional, aliados, inventario, RRHH y ROI.
