# Alohandote V183 · iCal + Catálogo Mobile

## Cambios puntuales

1. iCal para Airbnb/Booking
   - El endpoint `/api/ical/:id.ics` ya no debe responder HTTP 500 cuando Firestore exige autenticación.
   - Se agregó una colección mínima `publicIcalBlocks` para disponibilidad pública sin datos personales.
   - Las reservas de alojamiento guardan/actualizan su bloque público iCal automáticamente.
   - Las anuladas/canceladas se exportan como liberadas.

2. Catálogo mobile
   - Ajuste solo en el CSS imprimible de catálogos para móvil/iOS.
   - El PDF móvil se fuerza a una hoja A4 proporcional, evitando que se parta en 2 páginas por escala.

## No se tocó

Caja, reservas, compra/venta de $, devoluciones, mantenimiento, tasas, RRHH, inventario, login ni documentos comerciales.

## Reglas Firebase

Publicar `firestore.rules` porque incluye la regla de lectura pública segura para `publicIcalBlocks`.
