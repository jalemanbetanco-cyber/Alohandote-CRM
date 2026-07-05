# V127 - Pruebas automáticas de negocio

## Objetivo
Agregar pruebas automáticas para proteger reglas críticas antes de seguir optimizando el sistema.

## Qué se agregó

### Archivo de pruebas
`tests/business-rules.test.mjs`

### Nuevo comando
`npm run test:business`

### quality:all actualizado
Ahora ejecuta:

1. `npm run quality:smoke`
2. `npm run test:business`
3. `npm run quality:build`

## Reglas validadas

### Pagos
- Pago en Bs se convierte a USD equivalente.
- Pago en USD/Zelle mantiene monto USD.
- Monto Bs usa tasa congelada cuando corresponde.
- Pendiente por cobrar calcula correctamente.

### Roles
- `operator` / `operador` siguen funcionando.
- Admin conserva acceso total.
- Contabilidad no tiene permisos de RRHH.
- Solo lectura se etiqueta correctamente.

### Mantenimiento
- Reservas iCal/Airbnb no son mantenimiento.
- `maintenanceType` solo no basta.
- Costo real sí clasifica mantenimiento.
- Costo Bs usa tasa dólar BCV.

### Operaciones públicas
- Token seguro.
- Snapshot de tarea.
- Entrega / recepción / limpieza se clasifican correctamente.
- Etiquetas de submissions.

## No cambia
- UI.
- Reservas.
- Cotizaciones.
- Caja.
- iCal.
- Mantenimiento.
- RRHH.
- Inventario.

Esta versión solo agrega protección técnica para que las siguientes mejoras sean más seguras.
