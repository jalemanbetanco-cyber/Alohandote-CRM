# V130 - Monitor de errores y salud del sistema

## Objetivo
Agregar una vista administrativa para detectar errores y señales de riesgo operativo.

## Qué se agregó

### Servicio
`src/services/healthService.js`

### Nueva tarjeta
En Administración ERP:

`Monitor de salud`

## Qué muestra
- Estado general
- Eventos críticos
- Errores altos
- Cantidad de eventos
- Últimos eventos
- Recomendaciones

## Acciones disponibles
- Exportar salud
- Limpiar eventos

## Qué eventos registra
- Errores visibles al usuario
- Problemas con tasas
- Señales de Firebase/Auth/Storage
- Permission denied
- Timeouts o fallbacks

## Pruebas
Se agregaron pruebas automáticas al archivo:

`tests/business-rules.test.mjs`
