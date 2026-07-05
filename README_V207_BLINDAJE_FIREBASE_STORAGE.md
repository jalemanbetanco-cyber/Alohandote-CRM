# V207 · Blindaje Firebase / Storage sin alterar flujos estables

## Objetivo
Fortalecer la seguridad del CRM Alohandote sobre la base V206 desplegada, sin modificar los flujos funcionales existentes de reservas, caja, aliados, documentos, iCal, RRHH, inventario, kilometraje ni ROI.

## Alcance implementado

### 1. Firestore Rules por dominio
Se reemplazó la regla amplia V180/V206 que permitía crear y actualizar casi cualquier colección a todo usuario activo. Ahora existen reglas explícitas para:

- `reservations`
- `lodgingReservations`
- `clientLeads`
- `vehicles`
- `accommodations`
- `vehicleCheckins`
- `inventoryItems`
- `inventoryMovements`
- `generalExpenses`
- `dollarPurchases`
- `hrPeople`
- `hrTasks`
- `auditLogs`
- `publicReceptionTokens`
- `publicOperationSubmissions`
- `publicIcalBlocks`

### 2. Protección de módulos sensibles
- Finanzas/caja/gastos/divisas: escritura solo admin, supervisor o contabilidad.
- RRHH: escritura solo admin o supervisor.
- Inventario: escritura solo admin, supervisor o mantenimiento.
- Catálogos maestros de vehículos/alojamientos: escritura solo admin o supervisor.
- Auditoría: escritura del sistema por usuario activo; lectura solo admin/supervisor.
- Eliminaciones críticas: se mantienen solo para admin.

### 3. Links públicos de operaciones
Se preservó el flujo de operaciones públicas mediante tokens. Las reglas permiten:

- Leer token público solo si está activo y vigente.
- Crear/actualizar submissions públicas solo si el token existe, está activo, tiene scope `public-operations` y no expiró.

### 4. Storage Rules endurecidas
Se reemplazó la escritura global en cualquier ruta por rutas controladas:

- `reservation-docs/{uid}/{fileName}`: documentos/comprobantes de reservas del usuario autenticado.
- `vehicle-checkins/{uid}/{fileName}`: evidencias operativas del usuario autenticado.
- `catalog-photos/{assetId}/{fileName}`: fotos maestras solo admin/supervisor.

Toda ruta no declarada queda bloqueada para escritura por defecto.

### 5. Controles de calidad
Se actualizaron:

- `scripts/security-static-check.mjs`
- `scripts/production-gate.mjs`
- `tests/business-rules.test.mjs`

para verificar que el blindaje V207 permanezca presente antes de producción.

## Módulos no modificados

No se modificó `src/App.jsx` ni lógica funcional. Se mantiene intacto:

- Reservas renta car.
- Reservas alojamientos.
- Aliados y cuentas por pagar propietario.
- Caja y abonos.
- Documentos PDF.
- iCal.
- Inventario.
- RRHH.
- Kilometraje/ROI.
- BCV.
- UI/UX estable de V206.

## Validación recomendada antes de desplegar

```bash
npm install
npm run production:check
npm run build
```

## Riesgo operativo controlado
Las reglas son más seguras que V206. Si algún usuario no puede guardar después del despliegue, revisar primero su documento en `/users/{uid}` y confirmar:

- `active` o `isActive` no estén en `false`.
- `role` corresponda a su responsabilidad real.

## Roles esperados
- `admin`
- `supervisor`
- `accounting`
- `seller`, `seller_all`, `seller_lodging`
- `operator_general`, `operator_rentcar`, `operator_lodging`
- `vehicle_reception`
- `cleaning`
- `maintenance`
- `readonly`

También se mantiene compatibilidad con etiquetas legadas en español como Administrador, Supervisor, Contabilidad, Vendedor, Limpieza y Mantenimiento.
