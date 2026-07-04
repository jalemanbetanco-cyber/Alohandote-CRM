# V188 · Sincronización entrante iCal Airbnb regional

Corrección puntual sobre iCal entrante.

## Problema
Airbnb sí aceptaba el calendario público de Alohandote, pero Alohandote no podía importar el iCal de Airbnb para bloquear automáticamente el calendario interno.

La causa principal era que Airbnb entrega enlaces regionales como `airbnb.cl`, `airbnb.es`, `airbnb.mx`, etc. El proxy seguro anterior aceptaba `airbnb.com`, pero rechazaba dominios regionales.

## Cambio aplicado
- Se permite de forma segura Airbnb regional (`*.airbnb.*`).
- Se mantienen bloqueados dominios locales/privados para evitar SSRF.
- Se mantienen proveedores conocidos: Booking, VRBO/HomeAway, Google Calendar.
- El proxy devuelve mejor detalle del error si algún proveedor responde mal.

## No tocado
Caja, reservas financieras, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario, contratos, recibos, cotizaciones y catálogo PDF.

## Prueba
1. Copiar enlace iCal de Airbnb.
2. Pegar en el alojamiento dentro de `Calendarios iCal externos`.
3. Guardar alojamiento.
4. Presionar `Sincronizar iCal guardado`.
5. Confirmar que se creen bloqueos iCal en el calendario interno.
