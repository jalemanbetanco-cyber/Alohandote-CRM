# V186 · iCal route real + PDF mobile sin blob link

## Cambios puntuales

1. iCal
- Se agregó ruta API real `/api/ical/{alojamiento}.ics` para que Vercel no devuelva `index.html`.
- Se agregó rewrite explícito en `vercel.json` hacia `/api/lodging-ical.ics`.
- Se mantiene lectura desde `publicIcalBlocks` sin datos personales.

2. PDF mobile
- Se agregó `Compartir PDF limpio` usando Web Share API con archivo PDF real.
- Se evita compartir `blob:https://...` como enlace de WhatsApp.
- Se mantiene `Descargar PDF limpio` como respaldo.

## No tocado
Caja, compra/venta $, devoluciones, mantenimiento, tasas, RRHH, inventario, reservas financieras y reglas de negocio estables.
