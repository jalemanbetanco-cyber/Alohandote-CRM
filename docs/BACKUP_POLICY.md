# V129 - Política de backups y exportación técnica

## Objetivo
Tener una salida técnica segura de datos operativos para respaldo, auditoría y continuidad.

## Tipos de exportación agregados

### Backup JSON
Exporta un snapshot técnico estructurado:
- manifest
- collections

### Backup Excel
Exporta pestañas resumidas por colección.

### Auditoría sensible
Exporta solo:
- auditLogs
- publicOperationSubmissions
- vehicleCheckins

Solo visible para administrador.

## Datos incluidos
- vehicles
- reservations
- accommodations
- lodgingReservations
- clientLeads
- vehicleCheckins
- inventoryItems
- inventoryMovements
- hrPeople
- hrTasks
- dollarPurchases
- publicOperationSubmissions
- auditLogs

## Protección de datos sensibles
Se enmascaran campos como:
- cédula / documento
- teléfono
- correo
- comprobantes
- referencias de pago
- licencias
- documentos adjuntos
- direcciones

## Recomendación operativa
- Descargar backup JSON semanal.
- Descargar backup Excel mensual.
- Guardar copias fuera del computador principal.
- No compartir backups por WhatsApp si contienen información operativa sensible.
