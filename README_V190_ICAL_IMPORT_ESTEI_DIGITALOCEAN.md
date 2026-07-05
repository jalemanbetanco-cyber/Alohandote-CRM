# V190 · iCal import Estei DigitalOcean Spaces

Corrección puntual para sincronización entrante Estei → Alohandote.

## Cambios
- Permite el dominio real de Estei: `estei.nyc3.digitaloceanspaces.com` y `*.digitaloceanspaces.com`.
- Mantiene permitidos Airbnb regional, Booking, VRBO/HomeAway y Google Calendar.
- Parser iCal más tolerante para `DTSTART;TZID=...`, `DTSTART;VALUE=DATE` y fechas con hora.
- No toca caja, reservas financieras, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario, documentos, catálogos ni login.

## Prueba
1. Pegar URL iCal real de Estei en el alojamiento.
2. Guardar alojamiento.
3. Presionar Sincronizar iCal guardado.
4. Verificar que las fechas de Estei bloqueen el calendario Alohandote.
