# V129 - Backups y exportación técnica de datos sensibles

## Objetivo
Agregar herramientas de respaldo y auditoría sin modificar la lógica operativa del sistema.

## Qué se agregó

### Servicio
`src/services/backupService.js`

### Nueva tarjeta en Administración ERP
`Backups técnicos`

### Botones
- Backup JSON
- Backup Excel
- Auditoría sensible

## Qué protege
Los backups enmascaran campos sensibles:
- identificación
- teléfono
- email
- comprobantes
- licencias
- referencias de pago
- direcciones
- documentos adjuntos

## Qué colecciones respalda
- vehículos
- reservas
- alojamientos
- reservas de alojamientos
- clientes/cotizaciones
- recepciones
- inventario
- movimientos de inventario
- RRHH
- tareas RRHH
- compras de divisas
- operaciones públicas
- auditoría

## Auditoría
Cada exportación registra evento en `auditLogs`.

## Validación
Se agregaron pruebas automáticas para:
- manifiesto de backup
- sanitización de datos sensibles
- estructura del payload técnico
