# V126 - Mapa de separación de servicios

## Objetivo
Empezar a separar lógica de negocio de `App.jsx` sin romper el sistema actual.

## Servicios creados

### src/domain/money.js
Funciones puras para:
- tasas
- pago en Bs / USD
- pendiente por cobrar
- bucket de caja
- tasa congelada

### src/domain/roles.js
Funciones puras para:
- normalizar roles
- etiquetas de roles
- permisos por módulo

### src/domain/maintenance.js
Funciones puras para:
- detectar mantenimiento real
- excluir iCal/Airbnb
- costo de mantenimiento
- caja de mantenimiento

### src/services/publicOperationsService.js
Funciones para:
- generar token
- snapshot de tareas públicas
- etiquetas de submissions
- clasificación de operaciones públicas

## Regla aplicada
Esta versión agrega servicios, pero NO migra de golpe toda la app.
Se dejan servicios listos para ir sustituyendo funciones internas en fases pequeñas.

## Próxima fase técnica
V127 puede empezar a usar estos servicios dentro de App.jsx de forma controlada, uno por uno, con pruebas de humo.
