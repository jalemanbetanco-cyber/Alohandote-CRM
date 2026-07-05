# V192 · iCal export inmediato Alohandote → Airbnb/Estei

Corrección puntual sobre V191.

## Cambio
- Al crear o editar una reserva interna de alojamiento, se refresca inmediatamente `publicIcalBlocks`.
- El feed público iCal reduce cache a 60 segundos para que los botones de actualización manual de Airbnb/Estei lean más rápido.

## No se tocó
Caja, reservas financieras, compra/venta de divisas, devoluciones, mantenimiento, tasas, RRHH, inventario, documentos, catálogos, login, importación iCal Airbnb/Estei.

## Nota operativa
Airbnb/Estei leen el iCal por sistema de suscripción. Alohandote actualiza el feed al guardar la reserva, pero la plataforma externa debe refrescar/importar el feed para reflejarlo.
