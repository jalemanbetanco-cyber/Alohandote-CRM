# V187 · iCal estricto Airbnb / Estei

Corrección puntual sobre V186. No modifica caja, reservas financieras, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario ni documentos.

## Cambios

- Feed iCal minimalista compatible con importadores estrictos.
- Headers explícitos: `Content-Type: text/calendar; charset=utf-8`, `Content-Disposition: attachment`, `Access-Control-Allow-Origin: *`.
- Soporte HEAD para validadores externos.
- Alias corto alternativo: `/ical/{id}.ics`.
- Eventos exportados como `SUMMARY:Reserved` y propiedades mínimas RFC.

## Prueba

```bash
curl -I https://TU_DOMINIO/ical/ID_ALOJAMIENTO.ics
curl -L https://TU_DOMINIO/ical/ID_ALOJAMIENTO.ics
```

Debe responder `HTTP 200`, `text/calendar` y contenido que inicia con `BEGIN:VCALENDAR`.
