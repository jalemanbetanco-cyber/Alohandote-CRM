# V126 - Separar servicios por módulo sin romper App.jsx

## Objetivo
Empezar la separación profesional de lógica de negocio sin hacer una reescritura riesgosa.

## Qué se hizo
Se agregaron servicios y dominios independientes:

- `src/domain/money.js`
- `src/domain/roles.js`
- `src/domain/maintenance.js`
- `src/services/publicOperationsService.js`

## Qué contiene cada archivo

### money.js
Lógica de pagos:
- monto Bs
- monto USD equivalente
- método de pago
- cuentas por cobrar
- tasa congelada

### roles.js
Lógica de seguridad/roles:
- normalización de roles
- permisos por perfil
- etiquetas de usuario

### maintenance.js
Lógica de mantenimiento:
- detectar mantenimiento real
- excluir iCal/Airbnb
- costo mantenimiento
- medio de pago

### publicOperationsService.js
Lógica de operaciones públicas:
- token
- snapshot de tareas
- etiquetas de submissions
- clasificación logística pública

## Importante
Esta versión NO elimina funciones de `App.jsx` todavía.
La idea es preparar una migración segura por fases:

1. Crear servicios.
2. Validarlos con smoke test.
3. Migrar funciones una por una.
4. Probar cada cambio.
5. Evitar romper lógica operativa.

## No cambia
- Reservas
- Cotizaciones
- iCal
- Caja
- Mantenimiento
- RRHH
- Inventario
- Vista PC/mobile

## Validación
Se actualizó `npm run quality:smoke` para verificar que existan los nuevos servicios.
