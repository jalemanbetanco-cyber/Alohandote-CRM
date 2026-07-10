# V127 - Estrategia de pruebas automáticas

## Objetivo
Evitar que cambios futuros rompan reglas críticas de negocio.

## Capas de prueba actuales

### 1. Smoke test
Comando:

npm run quality:smoke

Valida estructura mínima del proyecto, archivos obligatorios, reglas base y servicios creados.

### 2. Business tests
Comando:

npm run test:business

Valida reglas puras de negocio:
- Pagos en Bs / USD.
- Tasa congelada.
- Pendiente por cobrar.
- Roles y permisos.
- Mantenimiento real vs iCal.
- Mantenimiento con costo.
- Operaciones públicas y tokens.

### 3. Quality all
Comando:

npm run quality:all

Ejecuta:
1. Smoke test.
2. Business tests.
3. Build de Vite.

## Próxima evolución
- Agregar pruebas de validación de formularios.
- Agregar pruebas de flujos críticos end-to-end.
- Agregar pruebas de reglas Firebase con emuladores.
