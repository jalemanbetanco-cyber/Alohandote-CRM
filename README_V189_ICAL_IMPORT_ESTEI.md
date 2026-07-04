# V189 · iCal import Estei

Corrección puntual sobre V188.

## Objetivo
Permitir que Alohandote lea calendarios externos de Estei (`estei.app`) para bloquear fechas en el calendario interno.

## Cambios
- Se agrega `estei.app` al allowlist seguro del proxy iCal.
- Se mantiene soporte para Airbnb regional, Booking, VRBO/HomeAway y Google Calendar.
- No se toca caja, reservas financieras, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario, documentos, catálogos ni reglas Firebase.

## Prueba
1. Copiar enlace iCal externo desde Estei.
2. Pegar en el alojamiento correspondiente dentro de Alohandote.
3. Guardar alojamiento.
4. Presionar “Sincronizar iCal guardado”.
5. Confirmar que las fechas de Estei quedan bloqueadas en Alohandote.
