# V130 - Monitor de errores y salud del sistema

## Objetivo
Detectar errores, permisos fallidos y señales de riesgo desde Administración ERP.

## Componentes
- `src/services/healthService.js`
- Tarjeta `Monitor de salud` en Administración ERP
- Exportación JSON de salud
- Eventos locales de salud

## Qué mide
- Errores críticos
- Errores altos
- Advertencias
- Cantidad de eventos
- Conteo de colecciones principales
- Recomendaciones operativas

## Eventos detectados
- Errores mostrados al usuario
- Error de tasas
- Señales de permiso denegado
- Firebase/Storage/Auth
- Timeout/fallback

## Acciones
- Exportar salud
- Limpiar eventos
- Revisar recomendaciones
